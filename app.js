//express, express-session, connect-mongo, connect-flash

const express = require('express')
const session = require ('express-session')
const MongoStore = require ('connect-mongo') 
const flash = require('connect-flash')
const router = require('./router')
const { marked } = require('marked')
const sanitizeHTML = require('sanitize-html')

const app = express ()

let sessionOptions = session ({
    secret:"this is session secreet",
    store:MongoStore.create({mongoUrl:process.env.CONNECTIONSTRING}), //SOME DIFFERENCE WITH V3++
    resave:false,
    saveUninitialized:false,
    cookie:{maxAge:1000*60*60*12,httpOnly:true} //time session
})

app.use(sessionOptions)
app.use(flash())

app.use(express.urlencoded({extended:false}))
app.use(express.json())


app.use (function (req,res,next) {
    //make markdown avail for ejs template
    res.locals.filterUserHTML = function(content) {
        return sanitizeHTML(marked(content), {allowedTags: ['p', 'br', 'ul', 'ol', 'li', 'strong', 'bold', 'i', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'], allowedAttributes: {}})
      }

    //make all error and succes flash msg avail for all template
    res.locals.errors = req.flash('errors')
    res.locals.success = req.flash('success')

    //save user login id to req object
    if (req.session.user) {
        req.visitorId = req.session.user._id
    }else {
        req.visitorId = 0
    }

    //save db to locals, so ejs can access it directly
    res.locals.user = req.session.user
    next()
})


app.use(express.static('public'))
app.set('views','views')
app.set('view engine', 'ejs') //using ejs (Embedded js)

app.use('/',router) //using router as director for next action

module.exports = app