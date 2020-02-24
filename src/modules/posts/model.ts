import mongoose from 'mongoose'
import mongoosePaginate from '../../utils/paginate'
import changeId from '../../utils/changeId'

const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

// table of content
const toc = new Schema({
  lvl: Number,
  content: String,
  slug: String
})

const schema = new Schema({
  // 作者
  author: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  // 分类
  category: {
    type: ObjectId,
    ref: 'Category',
    required: true
  },
  // 标题
  title: {
    type: String,
    required: true
  },
  // 摘要
  summary: {
    type: String,
    default: ''
  },
  // markdown 对应的 html
  content: {
    type: String,
    required: true
  },
  // markdown
  markdown: {
    type: String,
    required: true
  },
  // 封面图
  poster: {
    type: String,
    default: ''
  },
  // SEO 关键字
  keywords: {
    type: String,
    default: ''
  },
  // 喜欢数
  like: {
    type: Number,
    default: 0
  },
  // 浏览量
  pv: {
    type: Number,
    default: 0
  },
  // 标签
  tags: [String],
  // table of content
  toc: {
    type: [toc],
    default: []
  }
}, {
  timestamps: { createdAt: 'created', updatedAt: 'updated' }
})

schema.plugin(mongoosePaginate)

changeId(schema)

export default mongoose.model('Post', schema)
