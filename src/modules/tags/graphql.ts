import { GraphQLModule } from '@graphql-modules/core'
import { gql, UserInputError } from 'apollo-server'
import Tag from './model'
import { escapeChar } from '../../utils/shared'

function notFoundError() {
  throw new UserInputError('此标签不存在或已被删除')
}

module.exports = new GraphQLModule({
  imports: [require('../auth/graphql')],
  typeDefs: gql`
    type Query {
      tags(
        name: String
        page: Int
        limit: Int
      ): TagConnection!

      tag(id: ID!): Tag
    }

    type TagConnection {
      limit: Int!
      total: Int!
      page: Int!
      pages: Int!
      docs: [Tag!]!
    }

    type Tag {
      id: ID!
      name: String!
      keywords: String!
      created: String!
      sort: Int!
    }

    input TagInput {
      id: ID
      name: String
      keywords: String
      sort: Int
    }

    type Mutation {
      createOrUpdateTag(tag: TagInput!): Tag @auth(requires: [admin])
      deleteTag(id: ID!): ID @auth(requires: [admin])
    }
  `,
  resolvers: {
    Query: {
      async tags (_, { name, page = 1, limit = 10 }) {
        const query: {name?: object} = {}

        if (name) {
          query.name = new RegExp(escapeChar(name) + '.*', 'i')
        }

        const tags = await Tag.paginate(query, {
          sort: {sort: -1},
          page: +page,
          limit: +limit,
          leanWithId: true,
          lean: { virtuals: true }
        })

        return tags
      },
      async tag (_, { id }) {
        const tag = await Tag
          .findById(id)
          .lean({ virtuals: true })
          .catch(notFoundError)
    
        if (!tag) notFoundError()
    
        return tag
      }
    },
    Mutation: {
      async createOrUpdateTag (_, { tag }) {
        let tagDoc
    
        if (tag.id) {
          tagDoc = await Tag.findById(tag.id).catch(notFoundError)
          Object.assign(tagDoc, tag) 
        } else {
          tagDoc = new Tag(tag)
        }
    
        const result = await tagDoc.save()
        return result
      },
      async deleteTag (_, { id }) {
        const result = await Tag.remove({ _id: id }).catch(notFoundError)
    
        if (!result.n) {
          notFoundError()
        }
    
        return id
      }
    }
  },
  context: session => session
})
