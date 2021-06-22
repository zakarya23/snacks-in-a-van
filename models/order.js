const mongoose = require('mongoose')
const Cart = require('./cart').schema;
const User = require('./user').schema;
var Schema = mongoose.Schema

const orderSchema = new mongoose.Schema({
    orderNumber: Number,
    fulfilled: Boolean,
    pickedUp: Boolean,
    cancelled: Boolean,
    discounted: Boolean,
    orderTime: Number,
    pickUpTime: Number,
    rating: Number,
    comment: String,
    customer: User,
})

const Order = mongoose.model("orders", orderSchema)

module.exports = Order;