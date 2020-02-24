import fs from 'fs'
import { resolve } from 'path'
import dotenv from 'dotenv'

const config = dotenv.parse(fs.readFileSync(resolve(__dirname, '../.env')))

Object.assign(config, {
  IS_DEV: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test',
  IS_PROD: process.env.NODE_ENV === 'production'
})

module.exports = config
