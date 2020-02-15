import { GraphQLModule } from '@graphql-modules/core'
import { gql, UserInputError } from 'apollo-server'
import { isAdmin } from '../../utils/role'
import { validateSync } from '../../utils/dbValidation'
import User from './model'

module.exports = new GraphQLModule({
  imports: [require('../auth/graphql')],
  typeDefs: gql`
    type Query {
      users: [User!]! @auth(requires: [admin])
      me: User
    }

    type User {
      id: ID!
      username: String!
      role: Int
      created: String!
      avatar: String
      name: String
      githubId: Int
    }

    # 创建用户
    input CreateUserInput {
      username: String!
      password: String!
      avatar: String
      name: String
    }

    # 修改用户信息
    input UpdateUserInput {
      id: ID
      role: Int
      username: String
      name: String
      avatar: String
    }

    type Mutation {
      createUser(user: CreateUserInput): ID
      updateUser(user: UpdateUserInput): User @auth(requires: [admin, viewer])
      changePassword(oldPassword: String!, newPassword: String!): ID @auth(requires: [admin, viewer])
      login(username: String, password: String): User
      loginout: ID @auth(requires: [admin, viewer])
    }
  `,
  resolvers: {
    Query: {
      async users () {
        const users = await User
          .find()
          .select('-password')
          .lean({ virtuals: true })
    
        return users
      },
      me (_, __, { req }) {
        return req.session.user
      }
    },
    Mutation: {
      async createUser (_, { user }) {
        const repeat = await User.findOne({username: user.username})
        if (repeat) throw new UserInputError('用户名已存在')

        const userDoc = new User(user)

        const error = validateSync(userDoc)
        if (error) throw error

        const result = await userDoc.save()

        return result._id
      },
      async updateUser (_, { user }, { req }) {
        const { role, id } = req.session.user
        const adimn = isAdmin(role)
        const userDoc = await User.findById(adimn ? user.id || id : id)
  
        if (!adimn) {
          user.role = role
        }

        if (!user.id || (user.id && user.id === id)) {
          Object.assign(req.session.user, user)
        }

        Object.assign(userDoc, user)

        const result = await userDoc.save()

        return result
      },
      async login (_, { username, password }, { req }) {
        delete req.session.user
    
        const user:any = await User.findOne({username})
    
        if (!user) {
          throw new UserInputError('用户不存在')
        }
    
        const isMatch = await user.comparePassword(password)
    
        if (isMatch) {
          const { _id, username, name, avatar, created, role, githubId } = user
          const sessionUser = {
            id: _id, username, name, avatar, created, role, githubId
          }
    
          req.session.user = sessionUser
    
          return sessionUser
        } else {
          throw new UserInputError('密码错误')
        }
      },
      loginout (_, __, { req }) {
        const id = req.session.user.id
        delete req.session.user
        return id
      },
      async changePassword (_, { oldPassword, newPassword }, { req }) {
        const sessionUser = req.session.user
        const user = await User.findById(sessionUser.id)
        const isMatch = await user.comparePassword(oldPassword)
    
        if (isMatch) {
          Object.assign(user, { password: newPassword })
    
          const result = await user.save()
    
          delete req.session.user
    
          return result._id
        } else {
          throw new UserInputError('原密码错误，请重试')
        }
      }
    }
  },
  context: session => session
})
