import express from 'express'
import session from 'express-session'
import redis from 'redis'

const { SECRET_KEY, IS_PROD, COOKIE_DOMAIN } = require('../config')

export function createSession(app: express.Application, redisClient: redis.RedisClient) {
  const RedisStore = require('connect-redis')(session)

  app.use(
    session({
      store: new RedisStore({ client: redisClient }),
      secret: SECRET_KEY,
      resave: false,
      saveUninitialized: false,
      cookie: {
        domain: COOKIE_DOMAIN,
        secure: false,
        // 5天(120小时)，后过期
        maxAge: 120 * 3600 * 1000
      }
    })
  )
}