import mongoose from 'mongoose'
import mongoosePaginate from '../../utils/paginate'
import changeId from '../../utils/changeId' 

const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const schema = new Schema({
  // 评论类型, 文档：post / 留言：message / 反馈：feedback
  type: {
    type: String,
    required: [true, '{VALUE}：评论类型不能为空']
  },
  // 评论类型 id
  typeId: {
    type: ObjectId,
    required: [true, '{VALUE}：评论类型的id不能为空']
  },
  // 父 id：有的话就是回复了某条评论
  parentId: {
    type: ObjectId
  },
  // 评论人
  user: {type: ObjectId, ref: 'User'},
  // 回复对象
  to: {type: ObjectId, ref: 'User'},
  // 内容
  content: {
    type: String,
    required: [true, '请填写评论内容'],
    maxlength: [800, '评论字数最多800个字符']
  },
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  // 评论数
  count: {
    type: Number,
    default: 0
  }
}, {
  timestamps: { createdAt: 'created', updatedAt: 'updated' }
})

schema.plugin(mongoosePaginate)

changeId(schema)

export default mongoose.model('Comment', schema)
