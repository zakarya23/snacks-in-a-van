const bcrypt = require('bcryptjs');
const User = require('../models/user.js')
const Food = require('../models/food.js')
const Van = require('../models/van.js')
const session = require('express-session');
const Cart = require('../models/cart.js')
const TmpUser = require('../models/tmpUser.js')
const Order = require('../models/order.js')
const geolib = require('geolib');
const { response } = require('express');
const { distanceConversion } = require('geolib');

const addToDb = async(req, res) => {
    
    customer = await User.findById(req.session.user._id)
    if (!customer)
    {
        customer = await TmpUser.findById(req.session.user._id)
    }
    var found = customer.cart.find(o => (o.food._id == req.params.id));
    if (found)
    {
        found.quantity++;
        customer.cartCost = (Number(customer.cartCost) + Number(found.food.price)).toFixed(2) 
    }
    await customer.save();
    //this returns an "OK" status to let the webpage know it's done
    res.sendStatus(200);
}

const displayFoodDetails = async (req,res) => {
    result = await Food.findOne( {_id: req.params.id}, {} ).lean()
    res.render('foodDetails', {"food" : result, "van": req.params.van})
}

const takeToVanPage = async (req, res) => {
    // Get all possible food items from database
    result = await Food.find( {}, {name: true, price:true, photo:true} ).lean()
    customer = await User.findById(req.session.user._id)
    vans = await Van.find( {}, {name: true} ).lean()
    van = await Van.findOne({name: req.params.name},  {}).lean()
    if (!customer)
    {
        customer = await TmpUser.findById(req.session.user._id)
        if (!customer)
        { 
            allFoods = await Food.find()
            newCart = Cart[allFoods.length]
            const tmpUser = new TmpUser({ 
                // id: req.sessionID,
                cart: newCart,
                cartCost: 0,
                currentVanId: van._id.toString(),
                distance: 0
            })
            for (var i = 0; i < allFoods.length; i++)
            {
                const item = new Cart({food: allFoods[i], quantity: 0, subtotal: 0})
                tmpUser.cart.push(item)
            }
            tmpUser.save(function (err, newUser) {
                if (err) return console.error(err);
            });
            req.session.user = tmpUser;
            customer = tmpUser.toJSON();
        }
        //already have a temp user setup
        else
        {
            customer.currentVanId = van._id.toString();
            await customer.save()
            customer = await TmpUser.findById(req.session.user._id).lean()
        }

    }
    //already logged in
    else
    {
        customer.currentVanId = van._id.toString();
        await customer.save()
        customer = await User.findById(req.session.user._id).lean()
    }

    cost = customer.cartCost.toFixed(2)
    console.log(customer)
    res.render('menu', {"foods" : result,"cost": cost,  "van": req.params.name, "customer": 
    customer, "distance" : van.distance, user: req.session.user})
}

const getAllFoods = async (req, res) => {
    try {
        const foods = await Food.find({});

        res.json(foods)
    }
    catch(error)
    {
        console.error(error);
        res.status(500).json({message: "Server Error"});
    }
}

//gets food
const getFoodById = async (req, res) => {
    try {
        const foods = await Food.findById(req.params.id);

        res.json(foods)
    }
    catch(error)
    {
        console.error(error);
        res.status(500).json({message: "Server Error"});
    }
}

// validates login
const loginCustomer = async (req, res) => {
    try{
        user = await User.findOne({email: req.body.email}).lean()
        if(user){
            //use bcrpyt to compare provided password to hashed password in db
            const isMatch = await bcrypt.compare(req.body.password, user.password)
            if(isMatch){
                req.session.user = user
                if(user.lastOrder){
                    // take back to checkout page
                    vanName = await Van.findById(req.session.user.currentVanId)
                    res.redirect('/customer/checkOut/orderConfirmed/'+vanName.name);
                }
                else{
                    //not match
                    res.redirect('/customer')
                }
            }
            else{
                //incorrect password
                res.render('login.hbs', {error: true})
            }
        }
        else{
            //fail popup
            res.render('login.hbs', {error: true})
        }
    }
    catch(error){
        console.error(error);
        res.status(500).json({message: "Server Error"});
    }
}

const logoutCustomer = async (req, res) => {
    try{
        req.session.user = null;
        // res.render('aVeriGudLogoutPage.sandvich')
        res.redirect('/customer')
    }
    catch(error){
        console.error(error);
        res.status(500).json({message: "Server Error"});
    }
}

const removeFromDb = async(req, res) => {
    //do all the adding / database stuff here
    customer = await User.findById(req.session.user._id)
    if (!customer)
    {
        customer = await TmpUser.findById(req.session.user._id)
    }
    var found = customer.cart.find(o => (o.food._id == req.params.id));
    if (found)
    {
        if (found.quantity > 0)
        {
            customer.cartCost -= Number(found.food.price);
        }
    }
    customer.markModified("cart")
    await customer.save();
    //this returns an "OK" status to let the webpage know it's done
    res.sendStatus(200);
}

const register = async (req, res) => {
    try{
        //validate password
        newPsw = req.body.password
        if(isValidEmail(req.body.email)){
            if(newPsw.length > 7 && /\d/.test(newPsw) && /[a-zA-Z]/.test(newPsw)){
                allFoods = await Food.find()
                newCart = Cart[allFoods.length]
                //store encrypted password instead of plaintext
                const hashedPsw = await bcrypt.hash(req.body.password, 12)
    
                const newUser = new User({ 
                    givenName: req.body.name, 
                    familyName: req.body.lastName, 
                    email: req.body.email, 
                    password: hashedPsw, 
                    cart: newCart,
                    cartCost: 0
                })
                for (var i = 0; i < allFoods.length; i++)
                {
                    const item = new Cart({food: allFoods[i], quantity: 0, subtotal: 0})
                    newUser.cart.push(item)
                }
                newUser.save(function (err, newUser) {
                    if (err){
                        // duplicate email
                        res.render('register', {dupEmail : true}) 
                    }
                    else{
                        req.session.user = newUser;
                        res.render('registerAdded')
                    }
                });
            }
            else{
                // password does not meet requirements
                res.render('register', {badPassword : true}) 
            }
        }
        else{
            // email invalid
            res.render('register', {badEmail : true}) 
        }
    }
    catch(error)
    {
        console.error(error);
        res.status(500).json({message: "Server Error"});
    }
}

const loadRegisterPage = async (req, res) => {
    res.render('register')
}

const loadAccountPage = async (req, res) => {
    res.render('account', {user: req.session.user})
}

// updates user account details
const changeAccount = async (req, res) => {
    try{
        modified = false, badPassword = false, passwordNotMatch = false, badEmail = false,
        takenEmail = false;
        customer = await User.findById(req.session.user._id)
        if(req.body.name){
            customer.givenName = req.body.name
            modified = true
        }
        if(req.body.lastname){
            customer.familyName = req.body.lastname
            modified = true
        }
        // check unique
        if(req.body.email){
            if(isValidEmail(req.body.email)){
                check = await User.findOne({email: req.body.email})
                if(!check){
                    customer.email = req.body.email
                    modified = true
                }
                else{
                    takenEmail = true;
                }
            }
            else{
                badEmail = true;
            }
        }
        //updates password
        if(req.body.password){
            const isMatch = await bcrypt.compare(req.body.password, customer.password)
            if(isMatch){
                newPsw = req.body.newpassword
                if(newPsw.length > 7 && /\d/.test(newPsw) && /[a-zA-Z]/.test(newPsw)){
                    const hashedPsw = await bcrypt.hash(req.body.newpassword, 12)
                    customer.password = hashedPsw
                    modified = true
                }
                else{
                    badPassword = true;
                }
            }
            else{
                passwordNotMatch = true;
            }
        }
        if(modified){
            await customer.save();
            req.session.user = customer
        }
        res.render('account', {'badEmail' : badEmail, 'takenEmail' : takenEmail, 
        'badPassword' : badPassword, 'passwordNotMatch' : passwordNotMatch});
    }
    catch(error){
        console.error(error);
        res.status(500).json({message: "Server Error"});
    }
}

//sorts order of vans according to distance
function GetSortList(distance) {
    return function(a, b) {
        if (a[distance] > b[distance]) return -1;
        if (a[distance] < b[distance]) return 1;
        return 0; 
    }
}


async function ResVans(req, res, splash, location) {
	//create a null user so they can still add items to cart
	    if(!req.session.user){
        allFoods = await Food.find()
        newCart = Cart[allFoods.length]
        req.session.user = new User({ 
            givenName: null,
            familyName: null,
            email: null,
            password: null,
            cart: newCart,
            cartCost: 0
        })
    }

    if (location) {
        var userLocX = req.body.lat==null?-37.799985:req.body.lat;
        var userLocY = req.body.lng==null?144.961166:req.body.lng;

        vans = await Van.find( {}, {name: true, location:true} ).lean()
        vanDistances = [] 
        for (var i = 0; i < vans.length; i++) {
			var x = vans[i].location.coordinates[0];
			var y = vans[i].location.coordinates[1];
            dis = geolib.getDistance(
				{latitude:userLocX,longitude:userLocY},
				{latitude:x,longitude:y	}
				);
            var vanDis = {
                "dis": dis,
                "name" :vans[i].name,
                "address": vans[i].address, 
                "lat": x, 
                "lng": y,
            }
            vanDistances.push(vanDis)
        }
        // console.log(vanDistances)
        vanDistances.sort(GetSortList("dis"))
        var closestVans = vanDistances.slice(-5)
        // console.log(closestVans)
        res.render('startOrder', {"splash": splash, "vans": closestVans, user: req.session.user, "location":location})
    }
}

const closeVans = async (req, res) => {
    ResVans(req, res, true, true); 
}

const calculateClosestVans = async (req, res) => {
    console.log("AA"); 
	var userLocX = req.body.lat==null?-37.799985:req.body.lat;
	var userLocY = req.body.lng==null?144.961166:req.body.lng;
    vans = await Van.find( {}, {name: true, location:true} ).lean()
    console.log(userLocX)
    // Create an array of vans with dis and sort them according to distanve
    vanDistances = [] 
    for (var i = 0; i < vans.length; i++) {
        var x = vans[i].location.coordinates[0]
        var y = vans[i].location.coordinates[1]
        dis = geolib.getDistance(
				{latitude:userLocX,longitude:userLocY},
				{latitude:x,longitude:y	}
				);
        var vanDis = {
            "dis": dis,
            "name" :vans[i].name,
            "address": vans[i].address, 
            "lat": x, 
            "lng": y,
        }
        vanDistances.push(vanDis)
    }
    vanDistances.sort()
    vanDistances.reverse()
    var closestVans = vanDistances.slice(0,5)
    res.json({
        status:'success', 
        vans: closestVans,
    })
}

const customerHomePage =  async (req, res) => {
	ResVans(req, res, true, true);
}

const orderPage = async (req, res) => {
	ResVans(req, res, false, true);
}

const loginPage = async (req, res) => {
    res.render('login')
}

const checkout = async (req, res) => {
    customer = await User.findById(req.session.user._id)
    loggedIn = false;
    if (customer)
    {
        loggedIn = true;
    }
    else
    {
        customer = await TmpUser.findById(req.session.user._id)
    }
    //calculate subtotals
    for (var i = 0; i < customer.cart.length; i++) {
        customer.cart[i].subtotal = (Number(customer.cart[i].food.price) * customer.cart[i].quantity).toFixed(2);
    }
    customer.markModified("cart")
    await customer.save()
    if (loggedIn) customer = await User.findById(req.session.user._id).lean();
    else customer = await TmpUser.findById(req.session.user._id).lean();
    cart = customer.cart
    cart = cart.filter(function(value, index, arr)
    {
        return value.quantity > 0;
    })
    cost = customer.cartCost.toFixed(2)
    van = await Van.findOne({name: req.params.van},  {}).lean()
    res.render('checkout', {"customer": customer,"distance": van.distance, "cost":cost, 
        "cart": cart, "van":req.params.van, "loggedIn": loggedIn, "address": van.address})
}

const confirmOrder = async (req, res) => {
    customer = await User.findById(req.session.user._id).lean();
    oldOrder = await Order.findOne({'customer._id': req.session.user._id, 'pickedUp': false, 'cancelled': false})
    if (oldOrder)
    {
        oldOrder.customer = customer;
        await oldOrder.save()
    }
    else
    {
        const newOrder = new Order({
            orderNumber: await Order.find().count() + 1,
            fulfilled: false,
            pickedUp: false,
            cancelled: false,
            discounted: false,
            orderTime: new Date().getTime(),
            customer: customer,
            rating: -1,
            comment: null,
        })
        newOrder.save(function (err, newOrder) {
            if (err) return console.error(err);
        });
    }
    res.sendStatus(200)
}

const loginAtCheckout = async (req, res) => {
    customer = await TmpUser.findById(req.session.user._id).lean();
    oldCart = customer.cart;
    try{
        user = await User.findOne({email: req.body.email})
        if(user){
            //use bcrpyt to compare provided password to hashed password in db
            const isMatch = await bcrypt.compare(req.body.password, user.password)
            if(isMatch){
                req.session.user = user
                user.cart = oldCart;
                user.cartCost = customer.cartCost
                user.distance = customer.distance;
                await user.save();
                vanName = await Van.findById(req.session.user.currentVanId);
                res.redirect(vanName.name);
            }
        }
    }
    catch(error){
        console.error(error);
        res.status(500).json({message: "Server Error"});
    }
    res.sendStatus(200);
}

const registerAtCheckout = async (req, res) => {
    try{
        if(isValidEmail(req.body.email)){
            //validate password
            newPsw = req.body.password
            if(newPsw.length > 7 && /\d/.test(newPsw) && /[a-zA-Z]/.test(newPsw)){
                allFoods = await Food.find()
                newCart = Cart[allFoods.length]
                //store encrypted password instead of plaintext
                oldUser = await TmpUser.findById(req.session.user);
                const hashedPsw = await bcrypt.hash(req.body.password, 12)

                const newUser = new User({ 
                    givenName: req.body.name, 
                    familyName: req.body.lastName, 
                    email: req.body.email, 
                    password: hashedPsw, 
                    cart: oldUser.cart,
                    cartCost: oldUser.cartCost,
                    currentVanId: oldUser.currentVanId,
                    distance: oldUser.distance,
                })
                newUser.save(async function (err, newUser) {
                    if (err){
                        // duplicate email
                        res.render('register', {dupEmail : true}) 
                    }
                    else{
                        vanName = await Van.findById(req.session.user.currentVanId);
                        req.session.user = newUser;

                        res.redirect(vanName.name);
                    }
                });
            }
            else{
                // password does not meet requirements
                res.render('register', {badPassword : true}) 
            }
        }
        else{
            res.render('register', {badEmail : true}) 
        }
    }
    catch(error)
    {
        console.error(error);
        res.status(500).json({message: "Server Error"});
    }
}

const loadCheckoutRegister = async (req, res) => {
    res.render('checkoutRegister')
}

const confirmOrderPage = async (req, res) => {
    let cancellable = true;
    var date = new Date();
    van = await Van.findOne({name: req.params.van},  {}).lean()
    customer = await User.findById(req.session.user._id)
    order = await Order.findOne({'customer._id': customer._id, 'cancelled': false, 'pickedUp': false})
    if (!order) {
        res.render('rateOrder', {"van":req.params.van})
    }
    else {
        //Times 
        customer.lastOrder = order._id.toString()
        currentTime = date.getTime();
        cancelTime = date.setTime(order.orderTime + (10 * 1000 * 60))
        discountTime = date.setTime(order.orderTime + (20 * 1000 * 60))
        timePassed = cancelTime - currentTime
        if (timePassed < 0) cancellable = false;        
        //discounts
        if (discountTime - currentTime < 0 && !order.discounted && !order.fulfilled) {
            order.discounted = true;
            customer.cartCost *= 0.8;
            for (var i = 0; i < customer.cart.length; i++) {
                customer.cart[i].subtotal = (Number(customer.cart[i].subtotal) * 0.8).toFixed(2);
                // costs.push(subTotal) 
            }
        }

        await order.save()
        await customer.save();

        //JS objects
        customer = await User.findById(req.session.user._id).lean()
        order = await Order.findOne({'customer._id': customer._id, 'cancelled': false, 'pickedUp': false}).lean()
        cost = customer.cartCost.toFixed(2)
        costs = []
        cart = customer.cart
        cart = cart.filter(function(value, index, arr) {
            return value.quantity > 0;
        })

        res.render('orderConfirmed', {van : van, cost: cost, cart: cart, order: order, cancellable: cancellable, cancelTime: cancelTime, discountTime: discountTime})
    }
}

const cancelOrder = async (req, res) => {
    customer = await User.findById(req.session.user._id);
    order = await Order.findOne({'customer._id': customer, 'cancelled': false, 'pickedUp': false});
    order.cancelled = true;
    await order.save();
    for (var i = 0; i < customer.cart.length; i++)
    {
        customer.cart[i].quantity = 0;
    }
    customer.cartCost = 0
    customer.markModified("cart")
    customer.lastOrder = null
    await customer.save();
    res.sendStatus(200);
}

const rateOrder = async (req, res) => {
    res.render('rateOrder');
}

const saveRatedOrder = async (req, res) => {
    customer = await User.findById(req.session.user._id);
    if(customer.lastOrder){
        order = await Order.findById(customer.lastOrder)
        if(order.rating){
            order.rating = req.body.rating;
            order.comment = req.body.comment;
        }
        customer.lastOrder = null;
        await order.save();
        await customer.save();
    }
    // could also redirect to a "thanks for rating page" instead
    res.redirect('/customer')
}

function isValidEmail(s){
	return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(s); 
}

const updateLocation = async (req, res) => {
    user = await User.findById(req.session.user._id);
    if (user) 
    {
        user.distance = req.params.distance;
        await user.save();
    }
    res.sendStatus(200);
}

module.exports = {
    getAllFoods,
    getFoodById,
    loginCustomer,
    logoutCustomer,
    displayFoodDetails, 
    takeToVanPage,
    addToDb, 
    removeFromDb,
    register,
    loadRegisterPage,
    customerHomePage,
    calculateClosestVans,
    closeVans,
    orderPage,
    loginPage,
    checkout,
    confirmOrder,
    loginAtCheckout,
    registerAtCheckout,
    loadCheckoutRegister,
    confirmOrderPage,
    cancelOrder,
    // collectOrder,
    rateOrder,
    saveRatedOrder,
    loadAccountPage,
    changeAccount,
    updateLocation,
}