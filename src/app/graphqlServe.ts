import express from 'express'
import { ApolloServer } from 'apollo-server-express'
import { GraphQLModule } from '@graphql-modules/core'
import { SchemaDirectiveVisitor } from 'graphql-tools'

const { ENGINE_API_KEY, IS_DEV, IS_PROD, CORS_WHITELIST } = require('../config')

export function createGraphqlServe (app: express.Application, modules: Array<string>) {
  const AppModule = new GraphQLModule({
    imports: modules.map(name => require(`../modules/${name}/graphql`))
  })
  const { schema, schemaDirectives } = AppModule

  SchemaDirectiveVisitor.visitSchemaDirectives(schema, schemaDirectives);

  const server = new ApolloServer({
    context: session => session,
    schema: schema,
    debug: IS_DEV,
    // tracing: IS_DEV,
    engine: IS_PROD
      ? { apiKey: ENGINE_API_KEY, schemaTag: 'production' } 
      : {},
    introspection: IS_DEV,
    playground: IS_DEV ? {
      settings: {
        'request.credentials': 'include'
      }
    } : false,
    // cacheControl: { defaultMaxAge: 691200 }
    // cacheControl: {
    //   defaultMaxAge: 500,
    //   calculateHttpHeaders: false,
    //   stripFormattedExtensions: false,
    // }
  })

  const whitelist = CORS_WHITELIST.split(',')
  
  server.applyMiddleware({
    app,
    path: '/api',
    cors: {
      origin: function (origin, callback) {
        if (IS_DEV || !origin || whitelist.indexOf(origin) !== -1) {
          callback(null, true)
        } else {
          callback(new Error('Not allowed by CORS'))
        }
      },
      credentials: true
    }
  })
}
