// Importing all required files & libraries
const express = require('express')
const app = express() 
const port = process.env.PORT || 8080
const customerRouter = require('../routes/customerRouter')
const vendorRouter = require('../routes/vendorRouter')
const exphbs = require('express-handlebars')
const bodyParser = require('body-parser')
const path = require('path')
const session = require('express-session');
const bcrypt = require('bcryptjs');
const MongoDBSession = require('connect-mongodb-session')(session);


const store = new MongoDBSession({
    uri:"mongodb+srv://newuser1:newuser1@cluster.sacsx.mongodb.net/mongrelsdb?retryWrites=true&w=majority",
    collection: "sessions",
});
app.use(express.json({limit:'1mb'}));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
    // cookie lasts for 2 weeks
    cookie: { maxAge: 60000 * 60 * 24 * 7 * 2 },
    store: store,
}));

app.engine('hbs', exphbs({
    defaultLayout: 'main', 
    extname : 'hbs'
}))

app.set('view engine', 'hbs')
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, '../views')));
app.use(express.static(path.join(__dirname, '../public')));


// Base for all the db used. 
const {Food} = require('../db.js')
const {User} = require('../db.js')
const {Order} = require('../db.js')
const {Van} = require('../db.js')
const { setCookie } = require('../controllers/customerController')

// Routes we can take from the home page. 
app.use('/customer', customerRouter)
app.use('/vendor', vendorRouter)

// Port at which this is running
app.listen(port, () => {
    console.log(`server is listening on port`, port)
})

// Exports app for testing
module.exports = app