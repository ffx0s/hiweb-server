import redis from 'redis'

export function createRedis() {
  const redisClient = redis.createClient({ host: 'redis' })
  return redisClient
}
