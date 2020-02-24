import mongoose from 'mongoose'

const { MONGO_INITDB_DATABASE, MONGO_INITDB_USERNAME, MONGO_INITDB_PASSWORD } = require('../config')

export function createMongoose () {
  mongoose.set('useCreateIndex', true)
  mongoose.connect(`mongodb://${MONGO_INITDB_USERNAME}:${MONGO_INITDB_PASSWORD}@mongo:27017/${MONGO_INITDB_DATABASE}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
}
