import { createApp } from './app/express'
import { createRedis } from './app/redis'
import { createMongoose } from './app/mongoose'
import { createSession } from './app/session'
// import { createLimiter } from './app/limiter'
import { createOauthRoute } from './app/oauth'
import { createGraphqlServe } from './app/graphqlServe'

const { PORT } = require('./config')
const app = createApp()
const redisClient = createRedis()

createMongoose()
createSession(app, redisClient)
// createLimiter(app, redisClient)
createOauthRoute(app)
createGraphqlServe(app, ['users', 'posts', 'categories', 'tags', 'archives', 'comments', 'upyun'])

app.listen(PORT, () => console.log(`🚀 listening on port ${PORT}!`))
