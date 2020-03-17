import axios from 'axios'
import { GraphQLModule } from '@graphql-modules/core'
import { gql, ApolloError } from 'apollo-server'
import { prefixInteger } from '../../utils/shared'
import Category from '../categories/model'
import Post from '../posts/model'
import Archive from '../archives/model'
import Tag from '../tags/model'

const { GITHUB_OWNER, GITHUB_REPO, GITHUB_AUTH_TOKEN } = require('../../config')

async function createListRoutes (Model: any, { query = {}, limit, routePath }) {
  const routes = []
  const result = await Model.paginate(query, {
    limit,
    page: 1,
    select: 'pages',
    leanWithId: false,
    lean: { virtuals: true },
  })

  let pages = result.pages

  while (pages > 0) {
    routes.push(routePath + pages + '/')
    pages--
  }

  return routes
}

module.exports = new GraphQLModule({
  imports: [require('../auth/graphql')],
  typeDefs: gql`
    type Query {
      routes(
        postLimit: Int
        archiveLimit: Int
        tagLimit: Int
      ): [String!]!
    }
    type Mutation {
      build: Int @auth(requires: [admin])
    }
  `,
  resolvers: {
    Query: {
      async routes (_, { postLimit, archiveLimit, tagLimit }, ___) {
        const postIds = await Post.find().select('_id').lean()
        const postRoutes = postIds.map(({ _id }) => '/post/' + _id + '/')
        const postListRoutes = await createListRoutes(Post, {
          limit: postLimit,
          routePath: '/list/'
        })

        const categoryRoutes = []
        const categories = await Category.find().select('name posts').lean()

        categories.forEach(({ name, posts }) => {
          const routePath = '/category/' + name + '/'

          categoryRoutes.push(routePath)

          let pages = Math.ceil(posts.length / postLimit)

          while (pages > 0) {
            categoryRoutes.push(routePath + pages + '/')
            pages--
          }
        })

        const archiveListRoutes = await createListRoutes(Archive, {
          routePath: '/archives/page/',
          limit: archiveLimit
        })

        const archives = await Archive.find().select('date').lean()
        const archiveRoutes = archives.map(({ date }) => {
          const year = date.getFullYear()
          const month = prefixInteger(date.getMonth() + 1, 2)
          return `/archives/${year}-${month}/`
        })

        const tags = await Tag.find().select('name').lean()
        let tagListRoutes = []
        await Promise.all(
          tags.map(async ({ name }) => {
            const routePath = '/tag/' + name + '/'
            return createListRoutes(Post, {
              routePath,
              limit: tagLimit,
              query: {tags: name}
            }).then((routes) => {
              tagListRoutes.push(routePath)
              tagListRoutes = tagListRoutes.concat(routes)
            })
          })
        )

        const pageRoutes = [].concat(
          postRoutes,
          postListRoutes,
          categoryRoutes,
          archiveRoutes,
          archiveListRoutes,
          tagListRoutes
        )

        return pageRoutes
      }
    },
    Mutation: {
      async build (_, __, ___) {
        await axios({
          method: 'post',
          url: `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/dispatches`,
          headers: {
            Accept: 'application/vnd.github.everest-preview+json',
            Authorization: `token ${GITHUB_AUTH_TOKEN}`
          },
          data: {
            event_type: 'build'
          }
        }).catch(err => {
          throw new ApolloError(err.message)
        })

        return 200
      }
    }
  },
  context: session => session
})
