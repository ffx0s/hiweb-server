import { GraphQLModule } from '@graphql-modules/core'
import { gql } from 'apollo-server'
import * as crypto from 'crypto'
const { UPYUN_BUCKETNAME, UPYUN_USERNAME, UPYUN_PASSWORD } = require('../../config')

function MD5 (value: string) {
  return crypto
    .createHash('md5')
    .update(value)
    .digest('hex')
}

function hmacsha1 (secret: string, value: string) {
  return crypto.createHmac('sha1', secret).update(value).digest().toString('base64')
}

function sign (key: string, secret: string, method: string, uri: string, policy = null, md5 = null) {
  const elems = []
  ;[method, uri, policy, md5].forEach(item => {
    if (item != null) {
      elems.push(item)
    }
  })
  const value = elems.join('&')
  const auth = hmacsha1(secret, value)
  return `UPYUN ${key}:${auth}`
}

function authorization (saveKey: string) {
  const method = 'POST'
  const policy = Buffer.from(
    JSON.stringify({
      'save-key': saveKey || '/files/{random32}{.suffix}',
      bucket: UPYUN_BUCKETNAME,
      // 请求过期5分钟，http://docs.upyun.com/api/form_api/
      expiration: Math.round(Date.now() / 1000 + 60 * 5)
    })
  )
    .toString('base64')

  return {
    policy,
    sign: sign(
      UPYUN_USERNAME,
      MD5(UPYUN_PASSWORD),
      method,
      '/' + UPYUN_BUCKETNAME,
      policy
    )
  }
}

module.exports = new GraphQLModule({
  imports: [require('../auth/graphql')],
  typeDefs: gql`
    type Query {
      authorization(saveKey: String): AuthData @auth(requires: [admin, viewer])
    }

    type AuthData {
      policy: String!
      sign: String!
    }
  `,
  resolvers: {
    Query: {
      async authorization (_, { saveKey }) {
        return authorization(saveKey)
      }
    }
  },
  context: session => session
})
