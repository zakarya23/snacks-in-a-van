const express = require('express')
const vendorRouter = express.Router() 
const vendorController = require('../controllers/vendorController.js')

// Gets Vendor Home Page 
vendorRouter.get('/', vendorController.vendorLoginPage)

// Posts the login form for vendor
vendorRouter.post('/', (req, res) => vendorController.vendorLogin(req, res))

// To update vendors live location
vendorRouter.post('/vanLocation', vendorController.vanLocation)

// Progressive order loading
vendorRouter.post('/api/:count/:closed/:prepend/:checkTime/:lastID', vendorController.retrieveOrders)

// Home Page for vendor
vendorRouter.get('/home/:van', vendorController.vendorHomePage)

// Displays the order details for the van name selected. 
vendorRouter.post('/outstandingOrders/:name', vendorController.vanOrders)

// Setting status for vans
vendorRouter.get('/setStatus', vendorController.vanStatusPage)

// When a new van is to be added
vendorRouter.get('/vanStatus', vendorController.setStatus)

// Confirmation after a van is added 
vendorRouter.post('/vanStatus/added', vendorController.vanAdded)

// When an order is fullfilled 
vendorRouter.post('/fulfilled/:id', vendorController.orderDone)

// When we have unfullied orders 
vendorRouter.post('/unFulfilled/:id', vendorController.orderUndone)

// When an order is collected by customer
vendorRouter.post('/collectOrder/:id', vendorController.collectOrder)

module.exports = vendorRouter