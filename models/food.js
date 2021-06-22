const mongoose = require('mongoose')
var Schema = mongoose.Schema

const foodSchema = new mongoose.Schema({
    foodId: Schema.Types.ObjectId,
    name: {type: String, required: true},
    price: String,
    photo: String,
})

const Food = mongoose.model('foods', foodSchema)

module.exports = Food;