import * as mongoose from 'mongoose'

const { DB_URL } = require('../config')

export function createMongoose () {
  mongoose.set('useCreateIndex', true)
  mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
}
