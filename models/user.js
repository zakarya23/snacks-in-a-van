const mongoose = require('mongoose');
const Cart = require('./cart').schema;
var Schema = mongoose.Schema

const userSchema = new mongoose.Schema({
    userId: Schema.Types.ObjectId,
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    familyName: {type: String, required: true},
    givenName: String,
    cart: [Cart],
    cartCost: Number,
    currentVanId: String,
    distance: Number,
    lastOrder: String,
})

const User = mongoose.model('users', userSchema)

module.exports = User;