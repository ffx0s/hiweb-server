import * as express from 'express'
import { ApolloServer } from 'apollo-server-express'
import { GraphQLModule } from '@graphql-modules/core'
import { SchemaDirectiveVisitor } from 'graphql-tools'

const { ENGINE_API_KEY, PRODUCTION, DEVELOPMENT } = require('../config')

export function createGraphqlServe (app: express.Application, modules: Array<string>) {
  const AppModule = new GraphQLModule({
    imports: modules.map(name => require(`../modules/${name}/graphql`))
  })
  const { schema, schemaDirectives } = AppModule

  SchemaDirectiveVisitor.visitSchemaDirectives(schema, schemaDirectives);

  const server = new ApolloServer({
    context: session => session,
    schema: schema,
    debug: DEVELOPMENT,
    // tracing: !isProduction,
    engine: PRODUCTION
      ? { apiKey: ENGINE_API_KEY, schemaTag: 'production' } 
      : {},
    playground: {
      settings: {
        'request.credentials': 'include'
      }
    },
    // cacheControl: { defaultMaxAge: 691200 }
    // cacheControl: {
    //   defaultMaxAge: 500,
    //   calculateHttpHeaders: false,
    //   stripFormattedExtensions: false,
    // }
  })

  server.applyMiddleware({
    app,
    path: '/api',
    cors: {
      origin: PRODUCTION ? null : function (origin: string, callback: Function) {
        callback(null, true)
      },
      credentials: true
    }
  })
}
