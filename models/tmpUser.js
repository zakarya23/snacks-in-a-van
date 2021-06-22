const mongoose = require('mongoose');
const Cart = require('./cart').schema;
var Schema = mongoose.Schema

const tmpUserSchema = new mongoose.Schema({
    // id: Schema.Types.ObjectId,
    cart: [Cart],
    cartCost: Number,
    currentVanId: String,
    distance: Number
})

const TmpUser = mongoose.model('tmpUsers', tmpUserSchema)

module.exports = TmpUser;