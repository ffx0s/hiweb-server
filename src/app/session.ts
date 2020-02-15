import * as express from 'express'
import * as session from 'express-session'
import * as redis from 'redis'

const { SECRET_KEY, PRODUCTION } = require('../config')

export function createSession(app: express.Application, redisClient: redis.RedisClient) {
  const RedisStore = require('connect-redis')(session)

  app.use(
    session({
      store: new RedisStore({ client: redisClient }),
      secret: SECRET_KEY,
      resave: false,
      saveUninitialized: true,
      cookie: { secure: PRODUCTION, maxAge: 120 * 3600 * 1000 } // 5天(120小时)，后过期
    })
  )
}