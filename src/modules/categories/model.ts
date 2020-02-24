import mongoose from 'mongoose'
import changeId from '../../utils/changeId' 

const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const schema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  keywords: {
    type: String,
    default: ''
  },
  sort: {
    type: Number,
    default: 1
  },
  posts: [{type: ObjectId, ref: 'Post'}]
}, {
  timestamps: { createdAt: 'created', updatedAt: 'updated' }
})

// 更新栏目文档ID
schema.statics.updatePostId = function (
  method: string,
  categoryId: string|object,
  postId: string|object
) {
  return this.update({_id: categoryId}, { [method]: {posts: postId} })
}

changeId(schema)

export default mongoose.model('Category', schema)
