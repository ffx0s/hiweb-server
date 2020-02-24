import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import changeId from '../../utils/changeId' 
import Role from '../../utils/role'
import { isUserName } from '../../utils/validator'

const SALT_WORK_FACTOR = 10

const schema = new mongoose.Schema({
  // 用户名，用于登录
  username: {
    type: String,
    unique: true,
    required: [true, '请输入用户名'],
    validate: {
      validator: isUserName,
      message: '用户名格式有误，需为数字或字母且长度在4-16位之间'
    }
  },
  password: {
    type: String,
    required: [true, '请输入密码'],
    minlength: [6, '密码需大于6位'],
    maxlength: [60, '密码需小于60位']
  },
  // 昵称，用于前端显示
  name: {
    type: String,
    minlength: [1, '昵称需大于1个字符'],
    maxlength: [16, '昵称需小于16个字符']
  },
  // 头像
  avatar: {
    type: String
  },
  githubId: {
    type: Number,
    unique: true
  },
  role: {
    type: Number,
    default: Role.viewer
  }
}, {
  timestamps: { createdAt: 'created', updatedAt: 'updated' }
})

schema.pre('save', async function (next) {
  const user = this

  if (user.isNew && !user.name) {
    user.name = user.username
  }

  if (user.isNew || user.isModified('password')) {
    const salt = await bcrypt.genSalt(SALT_WORK_FACTOR)
    const hash = await bcrypt.hash(user.password, salt)

    user.password = hash

    next()
  } else {
    next()
  }
})

schema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password)
}

changeId(schema)

export default mongoose.model('User', schema)
