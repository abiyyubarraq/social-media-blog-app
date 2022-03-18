//dotenv for environment setup

//starting server form db file>go to app.js
const dotenv = require ('dotenv')
const mongodb = require ('mongodb').MongoClient
let mongoObjectId = require('mongodb').ObjectId;

dotenv.config()


mongodb.connect(process.env.CONNECTIONSTRING , {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client) {
    module.exports = client
    const app  = require ('./app')
    app.listen(process.env.PORT)
  })