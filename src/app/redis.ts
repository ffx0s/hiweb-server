import * as redis from 'redis'

export function createRedis() {
  const redisClient = redis.createClient()
  return redisClient
}
