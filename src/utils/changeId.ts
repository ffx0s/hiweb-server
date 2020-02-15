import * as mongooseLeanVirtuals from 'mongoose-lean-virtuals'

// 设置字段 id 的值等于 _id
export default function changeId (Schema) {
  Schema.virtual('id').get(function() {
    return this._id.toHexString()
  })

  Schema.plugin(mongooseLeanVirtuals)
}
