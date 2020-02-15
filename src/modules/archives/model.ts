import * as mongoose from 'mongoose'
import * as mongoosePaginate from '../../utils/paginate'
import changeId from '../../utils/changeId' 

const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const schema = new Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  posts: [{type: ObjectId, ref: 'Post'}]
}, {
  timestamps: { createdAt: 'created', updatedAt: 'updated' }
})

schema.plugin(mongoosePaginate)

// 更新存档记录：从当月的存档记录里添加/删除 postId
schema.statics.updatePostId = async function (
  postId: string|object,
  postCreated?: Date
) {
  if (postCreated) {
    // 删除
    const date = +new Date(postCreated.getFullYear(), postCreated.getMonth() + 1)
    const archive = await this.findOne({date})

    await archive.update({ $pull: {posts: postId} })
  } else {
    // 添加
    const current = new Date()
    const date = +new Date(current.getFullYear(), current.getMonth() + 1)
    let archive = await this.findOne({date})

    if (!archive) {
      archive = new this({ date, posts: [postId] })
      await archive.save()
    } else {
      await archive.update({ $addToSet: {posts: postId} })
    }
  }
}

changeId(schema)

export default mongoose.model('Archive', schema)
