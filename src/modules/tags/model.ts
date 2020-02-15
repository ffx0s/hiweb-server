import * as mongoose from 'mongoose'
import * as mongoosePaginate from '../../utils/paginate'
import changeId from '../../utils/changeId' 

const Schema = mongoose.Schema
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
  }
}, {
  timestamps: { createdAt: 'created', updatedAt: 'updated' }
})

schema.plugin(mongoosePaginate)

changeId(schema)

export default mongoose.model('Tag', schema)
