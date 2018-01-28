import mongoose, { Schema } from 'mongoose'

export default mongoose.model('BlackList', {
  email: {
    type: String,
    required: true,
    unique: true
  },
  notPaidPaymentId: {
    type: Schema.Types.ObjectId,
    required: true
  }
})
