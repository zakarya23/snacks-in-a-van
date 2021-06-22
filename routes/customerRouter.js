const express = require('express')
const bodyParser = require('body-parser')
var urlencodedParser = bodyParser.urlencoded({ extended: false })

const customerRouter = express.Router()
const customerController = require('../controllers/customerController.js')

// Home route (van landing with splash)
customerRouter.get('/',customerController.customerHomePage)

customerRouter.post('/', urlencodedParser, customerController.closeVans)

customerRouter.post('/api', urlencodedParser, customerController.calculateClosestVans)

// Direct van route (skip splash)
customerRouter.get('/startOrder', customerController.orderPage)

// Once user selects a van, they are sent to the menu of that van so 
// they can choose stuff to add to cart. 
customerRouter.get('/startOrder/:name', customerController.takeToVanPage)

// For displaying details of a food. 
customerRouter.get('/startOrder/:van/:id', customerController.displayFoodDetails)

// Do all the adding / database stuff here
customerRouter.post("/startOrder/:van/:id/add", customerController.addToDb)
customerRouter.post("/startOrder/:van/:id/remove", customerController.removeFromDb)

// Login page
customerRouter.get('/login', customerController.loginPage)

// Login process
customerRouter.post('/login', (req, res) => customerController.loginCustomer(req, res))

// Registration page
customerRouter.get('/register', customerController.loadRegisterPage)

// Registration Confirmed
customerRouter.post('/register', customerController.register)

// account details and modifications page
customerRouter.get('/account', customerController.loadAccountPage)

// get and apply account detail changes
customerRouter.post('/account', (req, res) => customerController.changeAccount(req, res))

// Customer logout
customerRouter.get('/logout', (req, res) => customerController.logoutCustomer(req, res))

// Loads register at checkout
customerRouter.get('/checkOut/register', (req, res) => customerController.loadCheckoutRegister(req, res))

// Once user has confirmed their order
customerRouter.post('/checkOut/confirm', customerController.confirmOrder)
customerRouter.get('/checkOut/orderConfirmed/:van', customerController.confirmOrderPage)

// If not logged in at entry 
customerRouter.post('/checkOut/login', customerController.loginAtCheckout)

// Register at Checkout 
customerRouter.post('/checkOut/register', customerController.registerAtCheckout)

// To cancel an order
customerRouter.post('/cancelOrder', customerController.cancelOrder)

// Cart Page 
customerRouter.get('/checkOut/:van', customerController.checkout)

customerRouter.post('/checkOut/:van', customerController.loginAtCheckout)


// customerRouter.post('/collectOrder', customerController.collectOrder)

// customer order ratings
customerRouter.get('/rateOrder', customerController.rateOrder)

customerRouter.post('/rateOrder', (req, res) => customerController.saveRatedOrder(req, res))

customerRouter.post('/updateLocation/:distance', customerController.updateLocation);

module.exports = customerRouter