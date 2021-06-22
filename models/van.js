const mongoose = require('mongoose')

const vanSchema = new mongoose.Schema({
  name: String,
  location: {
    type: {
      type: String, 
      enum: ['Point'], 
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  status: Boolean,
  address: String,
  password: {type: String, required: true}
});

const Van = mongoose.model('vans', vanSchema)

module.exports = Van;