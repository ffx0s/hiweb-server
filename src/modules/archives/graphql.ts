import { GraphQLModule } from '@graphql-modules/core'
import { gql, UserInputError } from 'apollo-server'
import { fieldsList } from 'graphql-fields-list'
import Archive from './model'

function notFoundError() {
  throw new UserInputError('此文档不存在或已被删除')
}

function getPopulate (info: any, postPath: string) {
  const postFields = fieldsList(info, { path: postPath }).join(' ')

  let populate: {
    path: string,
    select: string,
    populate?: Array<{path: string, select: string}>,
    options: object
  }

  if (postFields) {
    const categoryPath = postPath + '.category'
    const authorPath = postPath + '.author'
    const categoryFields = fieldsList(info, { path: categoryPath }).join(' ')
    const authorFields = fieldsList(info, { path: authorPath }).join(' ')

    populate = {
      path: 'posts',
      select: postFields,
      populate: [],
      options: {
        sort: {created: -1}
      }
    }

    categoryFields && populate.populate.push({path: 'category', select: categoryFields})
    authorFields && populate.populate.push({path: 'author', select: authorFields})
  }

  return populate
}

module.exports = new GraphQLModule({
  imports: [require('../posts/graphql')],
  typeDefs: gql`
    type Query {
      archives(
        page: Int
        limit: Int
      ): ArchiveConnection!

      archive(
        date: String!
        populate: String
      ): Archive
    }

    type ArchiveConnection{
      limit: Int!
      total: Int!
      page: Int!
      pages: Int!
      docs: [Archive!]!
    }

    type Archive {
      id: ID!
      name: String!
      posts: [Post]!
      postsNumber: Int!
      date: String!
    }
  `,
  resolvers: {
    Query: {
      async archives (_, { page = 1, limit = 10 }, __, info) {
        const populate = getPopulate(info, 'docs.posts')
        const sort = {date: -1}
        const archives = await Archive.paginate({}, {
          sort,
          page: +page,
          limit: +limit,
          populate: populate,
          leanWithId: false,
          lean: { virtuals: true },
        })

        archives.docs.forEach(archive => {
          archive.postsNumber = archive.posts.length
        })

        return archives
      },
      async archive (_, { date }, __, info) {
        const populate = getPopulate(info, 'posts')
        const archive = await Archive
          .findOne({ date: +new Date(date) })
          .populate(populate)
          .lean({ virtuals: true })
          .catch(notFoundError)
        if (!archive) notFoundError()
    
        return archive
      }
    }
  },
  context: session => session
})
