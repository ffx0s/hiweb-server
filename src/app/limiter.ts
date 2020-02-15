import * as express from 'express'
import * as redis from 'redis'

const RateLimit = require('express-rate-limit')
const RedisStore = require('rate-limit-redis')

const whitelist = ['127.0.0.1', '192.168.3.14', '1']

export function createLimiter (app: express.Application, redisClient: redis.RedisClient) {
  const limiter = new RateLimit({
    store: new RedisStore({
      client: redisClient
    }),
    windowMs: 1 * 60 * 1000,
    max: 50, // limit each IP to 100 requests per windowMs
    delayMs: 0, // disable delaying - full speed until the max limit is reached
    message: '调用频率过快，请稍后再重试',
    skip (req: express.Request) {
      const arr = req.ip.split(':')
      const ip = arr[arr.length - 1]
      return whitelist.indexOf(ip) !== -1
    }
  })

  app.use(limiter)
}