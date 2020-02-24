import { GraphQLModule } from '@graphql-modules/core'
import { gql, UserInputError } from 'apollo-server'
import { fieldsList } from 'graphql-fields-list'
import { compactObj } from '../../utils/shared'
import Comment from './model'

function notFoundError() {
  throw new UserInputError('此评论不存在或已被删除')
}

module.exports = new GraphQLModule({
  imports: [
    require('../auth/graphql'),
    require('../users/graphql')
  ],
  typeDefs: gql`
    type Query {
      comments(
        page: Int
        limit: Int
        offset: Int
        sort: Int
        type: CommentType
        typeId: String
        parentId: String
      ): CommentConnection!
    }

    enum CommentType {
      POST
      MESSAGE
      FEEDBACK
    }

    type CommentConnection {
      limit: Int!
      total: Int!
      pages: Int
      page: Int
      offset: Int
      docs: [Comment!]!
    }

    type Comment {
      id: ID!
      type: CommentType!
      typeId: String!
      parentId: String
      to: User
      user: User
      content: String!
      ip: String!
      userAgent: String!
      count: Int!
      created: String!
    }

    input CommentInput {
      typeId: String!
      type: CommentType!
      content: String!
      parentId: String
      to: String
    }

    type Mutation {
      addComment(comment: CommentInput!): Comment @auth(requires: [admin, viewer])
      deleteComment(id: ID!): ID @auth(requires: [admin])
    }
  `,
  resolvers: {
    Query: {
      async comments (_, options, __, info) {
        const { page = 1, limit = 10, offset = null, sort = -1, type = '', typeId = '', parentId = '' } = options

        const userFields = fieldsList(info, { path: 'docs.user' }).join(' ')
        const toFields = fieldsList(info, { path: 'docs.to' }).join(' ')
        const paginate = compactObj({ page, offset, limit })
        const query:any = compactObj({ type, typeId, parentId })

        if (typeId) {
          query.parentId = null
        }

        const comments = await Comment.paginate(query, {
          ...paginate,
          sort: {created: sort},
          leanWithId: true,
          populate: [{path: 'user', select: userFields}, {path: 'to', select: toFields}],
          lean: { virtuals: true },
        })

        return comments
      }
    },
    Mutation: {
      async addComment (_, { comment }, { req }) {
        comment.ip = req.ip
        comment.userAgent = req.headers['user-agent']
        comment.user = req.session.user.id

        const commentDoc = new Comment(comment)
        const task = []

        if (comment.parentId) {
          task.push(
            Comment.update({_id: comment.parentId}, {$inc: {count: 1}})
          )
        }

        task.push(commentDoc.save())

        await Promise.all(task)

        return commentDoc
      },
      async deleteComment (_, { id }) {
        const comment = await Comment.findByIdAndRemove(id).catch(notFoundError)
      
        if (comment) {
          if (comment.parentId) {
            await Comment.update({_id: comment.parentId}, {$inc: {count: -1}})
          }
        } else {
          notFoundError()
        }

        return id
      }
    }
  },
  context: session => session
})
