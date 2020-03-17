import express from 'express'
import redis from 'redis'
import RateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import { MD5 } from '../utils/shared'
const { UPYUN_PASSWORD } = require('../config')

const WHITE_LIST = ['127.0.0.1', '1']
const LIMITER_TICKET = MD5(UPYUN_PASSWORD)

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
      const ticket = LIMITER_TICKET === req.headers['limiter-ticket']

      return ticket || WHITE_LIST.indexOf(ip) !== -1
    }
  })

  app.use(limiter)
}