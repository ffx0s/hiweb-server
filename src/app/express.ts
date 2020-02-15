import * as express from 'express'
import * as cookieParser from 'cookie-parser'

export function createApp () {
  const app = express()

  app.use(cookieParser())
  app.enable('trust proxy')
  app.set('x-powered-by', false)

  return app
}
