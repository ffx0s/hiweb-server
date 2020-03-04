import { GraphQLModule } from '@graphql-modules/core'
import { gql, ApolloError } from 'apollo-server'
import axios from 'axios'

const { GITHUB_OWNER, GITHUB_REPO, GITHUB_AUTH_TOKEN } = require('../../config')

module.exports = new GraphQLModule({
  imports: [require('../auth/graphql')],
  typeDefs: gql`
    type Mutation {
      build: Int @auth(requires: [admin])
    }
  `,
  resolvers: {
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
