//  项目配置
const path = require('path')
const configFile = path.join(__dirname, process.env.NODE_ENV + '.js')
const config = require(configFile)

module.exports = config

/*
config = {
  // 是否开发环境
  DEVELOPMENT: true,
  // 是否生产环境
  PRODUCTION: false,
  // 应用端口
  PORT: 4001,
  // 数据库 URL
  DB_URL: 'mongodb://name:password@localhost:27017/dbname',
  // ENGINE_API_KEY
  ENGINE_API_KEY: '',
  // JWT SECRET_KEY
  SECRET_KEY: '',
  // github Client ID
  CLIENT_ID: '',
  // Client Secret
  CLIENT_SECRET: '',
  // 又拍云图片上传配置
  UPYUN_BUCKETNAME: '',
  UPYUN_USERNAME: '',
  UPYUN_PASSWORD: ''
}
*/