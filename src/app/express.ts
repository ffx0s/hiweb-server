import express from 'express'
import cookieParser from 'cookie-parser'

export function createApp () {
  const app = express()

  app.use(cookieParser())
  app.enable('trust proxy')
  app.set('x-powered-by', false)

  return app
}
