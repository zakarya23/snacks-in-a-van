// setup Mongoose
const mongoose = require('mongoose')
var Schema = mongoose.Schema
const dotenv = require('dotenv');
dotenv.config();
let mongoPassword = process.env.MONGO_PASSWORD;
console.log(mongoPassword);
let connectionURL =  "mongodb+srv://newuser1:"+mongoPassword+"@cluster.sacsx.mongodb.net/foodbuddydb?retryWrites=true&w=majority"

try {
    // Connect to the MongoDB cluster
     mongoose.connect(
      connectionURL,
      {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, dbName: 'foodbuddydb'},
      () => console.log("Mongoose is connected")
    );

  } catch (e) {
    console.log("could not connect");
  }
const db = mongoose.connection
// event handlers
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', () => {
    console.log('connected to Mongo')
})