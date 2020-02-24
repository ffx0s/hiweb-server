import { GraphQLModule } from '@graphql-modules/core'
import { gql, UserInputError } from 'apollo-server'
import { fieldsList } from 'graphql-fields-list'
import Category from './model'

function notFoundError(text = '') {
  throw new UserInputError(text || '此分类不存在或已被删除')
}

module.exports = new GraphQLModule({
  imports: [
    require('../auth/graphql'),
    require('../posts/graphql')
  ],
  typeDefs: gql`
    type Query {
      categories(sort: CategorySortInput): [Category!]!
      category(id: ID!): Category
    }

    type Category {
      id: ID!
      name: String!
      posts: [Post!]!
      postsNumber: Int!
      keywords: String!
      created: String!
      sort: Int!
    }

    input CategorySortInput {
      sort: Int
      created: Int
    }

    input CategoryInput {
      id: ID
      name: String
      keywords: String
      sort: Int
    }

    type Mutation {
      createOrUpdateCategory(category: CategoryInput): Category! @auth(requires: [admin])
      deleteCategory(id: ID!): ID @auth(requires: [admin])
    }
  `,
  resolvers: {
    Query: {
      async categories (_, { sort = { sort: -1 } }) {
        const categories = await Category
          .find()
          .sort(sort)
          .lean({ virtuals: true })
    
        categories.forEach(category => {
          category.postsNumber = category.posts.length
        })
    
        return categories
      },
      async category (_, { id }, __, info) {
        const postFields = fieldsList(info, { path: 'posts' }).join(' ')
        const category = await Category
          .findById(id)
          .populate(postFields ? { path: 'posts', select: postFields } : null)
          .lean({ virtuals: true })
          .catch(notFoundError)
    
        if (!category) notFoundError()
    
        category.postsNumber = category.posts.length
    
        return category
      }
    },
    Mutation: {
      async createOrUpdateCategory (_, { category }) {
        let categoryDoc
    
        if (category.id) {
          categoryDoc = await Category.findById(category.id).catch(notFoundError)
          Object.assign(categoryDoc, category) 
        } else {
          categoryDoc = new Category(category)
        }
    
        const result = await categoryDoc.save()
        result.postsNumber = result.posts.length
        return result
      },
      async deleteCategory (_, { id }) {
        // 只能删除没有文档的分类
        const result = await Category.findOneAndRemove({_id: id, posts: { $size: 0 } }).catch(notFoundError)
    
        if (!result) {
          notFoundError('此分类下有文档/分类不存在')
        }
    
        return id
      }
    }
  },
  context: session => session
})
