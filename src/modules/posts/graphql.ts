import { GraphQLModule } from '@graphql-modules/core'
import { gql, UserInputError } from 'apollo-server'
import { fieldsList } from 'graphql-fields-list'
import { compactObj, escapeChar } from '../../utils/shared'
import Post from './model'
import Archive from '../archives/model'
import Category from '../categories/model'

function notFoundError() {
  throw new UserInputError('此文档不存在或已被删除')
}

function getPopulate (info: any, pathArray: Array<string>) {
  return pathArray.map(fullPath => {
    const fields = fieldsList(info, { path: fullPath }).join(' ')
    return {path: fullPath.replace(/\w+\./g, ''), select: fields}
  })
}

module.exports = new GraphQLModule({
  imports: [require('../auth/graphql')],
  typeDefs: gql`
    type Query {
      posts(
        page: Int
        limit: Int
        title: String
        category: String
        tag: String
        created: Int
      ): PostConnection!

      post(id: ID!): Post

      adjacentPosts(id: ID!): AdjacentPost! 
    }

    type AdjacentPost {
      prev: Post
      next: Post
    }

    type Post {
      id: ID!
      title: String
      author: Author
      category: Category
      summary: String
      content: String
      markdown: String
      poster: String
      key: String
      keywords: String
      like: Int
      tags: [String!]!
      updated: String
      created: String
      pv: Int
      toc: [Toc!]!
    }

    type Toc {
      content: String
      lvl: Int
      slug: String
    }

    input TocInput {
      content: String!
      lvl: Int!
      slug: String!
    }

    type Author {
      id: ID!
      name: String
    }

    type Category {
      id: ID!
      name: String
    }

    type PostConnection {
      limit: Int!
      total: Int!
      page: Int!
      pages: Int!
      docs: [Post!]!
    }

    # 因为包含了创建和更新的输入字段，所以这里不做是否为空的校验
    input PostInput {
      id: ID
      title: String
      category: ID
      summary: String
      content: String
      markdown: String
      poster: String
      keywords: String
      tags: [String!]
      toc: [TocInput!]
    }

    type Mutation {
      createOrUpdatePost(post: PostInput!): ID @auth(requires: [admin])
      deletePost(id: ID!): ID @auth(requires: [admin])
    }
  `,
  resolvers: {
    Query: {
      async posts (_, { page = 1, limit = 10, category, title, tag, created = -1 }, __, info) {
        if (category) {
          // 根据分类id找出分类名，待优化：
          const result = await Category.findOne({ name: category }).select('_id')
          if (!result) notFoundError()
          category = result._id
        }

        if (title) {
          title = new RegExp(escapeChar(title) + '.*', 'i')
        }

        const postFields = fieldsList(info, { path: 'docs' }).join(' ')
        const populate = getPopulate(info, ['docs.category', 'docs.author'])
        const sort = { created }
        const query = compactObj({ category, title, tags: tag })
        const posts = await Post.paginate(query, {
          sort,
          page: +page,
          limit: +limit,
          select: postFields,
          populate: populate,
          leanWithId: false,
          lean: { virtuals: true },
        })

        return posts
      },
      async post (_, { id }, __, info) {
        const postFields = fieldsList(info, { path: '' }).join(' ')
        const populate = getPopulate(info, ['category', 'author'])
        const post = await Post
          .findById(id)
          .select(postFields)
          .populate(populate)
          .lean({ virtuals: true })
          .catch(notFoundError)
    
        if (!post) notFoundError()
    
        return post
      },
      async adjacentPosts (_, { id }, __, info) {
        const prevPostFields = fieldsList(info, { path: 'prev' }).join(' ')
        const nextPostFields = fieldsList(info, { path: 'next' }).join(' ')
        const [prev, next] = await Promise.all([
          // 上一条记录
          Post.findOne({ _id: {'$lt': id} }, prevPostFields).sort({_id: -1}).lean({ virtuals: true }),
          // 下一条记录
          Post.findOne({ _id: {'$gt': id} }, nextPostFields).sort({_id: 1}).lean({ virtuals: true }),
        ])
        return {prev, next}
      }
    },
    Mutation: {
      async createOrUpdatePost (_, { post }, { req }) {
        let postDoc
    
        post.author = req.session.user.id
    
        // 修改
        if (post.id) {
          postDoc = await Post.findById(post.id).catch(notFoundError)
    
          if (!postDoc) notFoundError()
    
          const categoryId = postDoc.category.toString()
          const newCategoryId = post.category
    
          // 如果文档更换了分类：
          if (newCategoryId !== categoryId) {
            await Promise.all([
              // 删除原分类下的文档id
              Category.updatePostId('$pull', categoryId, post.id),
              // 添加文档id到新分类
              Category.updatePostId('$push', newCategoryId, post.id)
            ])
          }
      
          Object.assign(postDoc, post)
    
        // 新增
        } else {
          postDoc = new Post(post)
    
          const postId = postDoc.id.toString()
          const categoryId = postDoc.category.toString()
    
          await Promise.all([
            Category.updatePostId('$push', categoryId, postId),
            Archive.updatePostId(postId)
          ])
        }
    
        const result = await postDoc.save()
        return result.id
      },
      async deletePost (_, { id }) {
        const post = await Post.findByIdAndRemove({ _id: id }).catch(notFoundError)
    
        if (post) {
          await Promise.all([
            Category.updatePostId('$pull', post.category, post.id),
            Archive.updatePostId(post.id, post.created)
          ])
        } else {
          notFoundError()
        }
    
        return id
      }
    }
  },
  context: session => session
})