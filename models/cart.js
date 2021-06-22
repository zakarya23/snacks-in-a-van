const mongoose = require('mongoose')
const Food = require('./food').schema;


const cartSchema = new mongoose.Schema({
    food: Food,
    quantity: Number,
    subtotal: String,
})

const Cart = mongoose.model('carts', cartSchema)

module.exports = Cart;