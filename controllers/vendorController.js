const bcrypt = require('bcryptjs');
const User = require('../models/user.js')
const Van = require('../models/van.js')
const session = require('express-session');
const Order = require('../models/order.js')

const vendorLoginPage = (req, res) => {
    res.render('vendorLogin')
}

const vendorLogin = async (req, res) => {
    try{
        van = await Van.findOne({name: req.body.name}).lean()
        if(van){
            //use bcrpyt to compare provided password to hashed password in db
            const isMatch = await bcrypt.compare(req.body.password, van.password)
            if(isMatch){
                // res.redirect('/vendor/home')
				req.session.user = van;
                res.render('vendorHome', {vendor:true,"van":van})
            }
            else{
                res.sendStatus(200);
                res.redirect('/vendor')
                // alert("Incorrect name or password")
            }
        }
        else{
            //res.json({message: "Incorrect email or password"});
            //fail popup
            // alert("Incorrect name or password")
            res.redirect('/vendor')
        }
    }
    catch(error){
        console.error(error);
        res.status(500).json({message: "Server Error"});
    }
}

const vanLocation  = async (req, res) => {
    van = await Van.findById(req.session.user);
    console.log("ent")
    console.log(req.body.lat)
    let coordinates = []
    coordinates[0] = req.body.lat
    coordinates[1] = req.body.lng
    van.location.coordinates = coordinates;
    await van.save();
}

const vendorHomePage = async (req, res) => {
    van = await Van.findOne({name: req.params.van})
    van.status = false
    await van.save();
    van = van.toJSON()
    res.render('vendorHome', {vendor:true,"van":van})
}

const vanOrders = async (req, res) => {
    // console.log("ent")
    // console.log(req.body.lat)
    van = await Van.findById(req.session.user);

    van.address = req.body.address;
    van.status = true;
    console.log(req.body.address)
   
    van.location.markModified("coordinates");
    // console.log(req.body.address)
    // console.log("ent")
    // console.log(req.body.lat)
    await van.save();
    van = van.toJSON();
    vanID = van['_id']
    orders = await Order.find({'customer.currentVanId': req.session.user._id, pickedUp: false, 'cancelled': false}, {}).lean()
    var orderTime = orders.orderTime
    var hours = new Date().getHours(orderTime)
    if (hours >= 12) {
        hours = hours - 12 
        var time = {"hours": hours, "minutes": new Date().getMinutes(orderTime), "type":"pm"}
    }
    else {
        var time = {"hours": hours, "minutes": new Date().getMinutes(orderTime), "type":"am"}
    }
    
    res.render('outstandingOrders', {vendor:true, "orders": orders, "time": time, "van":van})
}

const retrieveOrders = async (req, res) => {
	retrieveCount = req.params.count;
	isPastOrder = req.params.closed;
	isPrepend = (req.params.prepend=="true");
	checkTime = req.params.checkTime;
	rejectLast = req.params.lastID;
	vanID = req.session.user._id;

	oTime = isPrepend ? { $gte: checkTime } : { $lte: checkTime };
    orders = await Order.find({'customer.currentVanId': vanID, orderTime: oTime}, {}).lean();
	// orders = await Order.find({'customer.currentVanId': vanID, orderTime: oTime, 'customer.givenName': customerName}, {}).lean();

	if(!isPrepend) orders.reverse();
	if(orders.length>0 && orders[0].orderNumber==rejectLast) orders.shift();
	orders = orders.slice(0,retrieveCount);

    res.json({
        status: 'success', 
        orders:  orders,
    })
}

const collectOrder = async (req, res) => {
    order = await Order.findById(req.params.id);
    customer = await User.findById(order.customer._id);
    order.fulfilled = true;
    order.pickedUp = true;
    order.pickUpTime = new Date().getTime();
    await order.save();
    //Clear cart
    for (var i = 0; i < customer.cart.length; i++)
    {
        customer.cart[i].quantity = 0;
    }
    customer.cartCost = 0;
    customer.markModified("cart");
    await customer.save();
    res.sendStatus(200);
}

const vanAdded = async (req, res) => {
    let coordinates = []
    coordinates[0] = req.body.X
    coordinates[1] = req.body.Y
    const hashedPsw = await bcrypt.hash(req.body.password, 12)
    const newVan = new Van({ 
        name: req.body.name,
        location: 
        {
            type: 'Point',
            coordinates: coordinates
        },
        status: true,
        address: req.body.address,
        password: hashedPsw
    })
    newVan.save(function (err, newVan) {
        if (err) return console.error(err);
    });
    // need to deal with pre-existing redundant routing first
    res.render('vanAdded', {vendor:true})
}

const orderDone = async (req, res) => {
    order = await Order.findById(req.params.id);
    order.fulfilled = true;
    await order.save();
    res.sendStatus(200)
}

const orderUndone = async (req, res) => {
    order = await Order.findById(req.params.id);
    order.fulfilled = false;
    await order.save();
    res.sendStatus(200)
}

const setStatus = (req, res) => {
    res.render('vanStatus', {vendor:true})
}

const vanStatusPage = (req, res) => {
    res.render('setVanStatus', {vendor:true})
}

module.exports = {
    vendorLoginPage,
    collectOrder,
    vendorHomePage,
    vanOrders,
    vanAdded,
    orderDone,
    orderUndone,
    setStatus,
    vanStatusPage,
    vendorLogin,
	retrieveOrders,
    vanLocation,
}
