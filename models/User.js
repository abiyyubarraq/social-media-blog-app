//validator, bcrypt, md5

const usersCollection = require ('../db').db().collection('users')
const validator = require ('validator')
const bcrypt = require ('bcrypt')
const md5 = require('md5')

//User blueprint
let User = function (data,getAvatar) {
    this.data = data
    this.errors = []
    if (getAvatar == undefined) {
        getAvatar = false
    }
    if (getAvatar ) {
        this.getAvatar()
    }
}

//for cleaningup any weird input 
User.prototype.cleanUp = function () {
    if (typeof(this.data.username)!="string") {
        this.data.username = ""
    }
    if (typeof(this.data.email)!="string") {
        this.data.email = ""
    }
    if (typeof(this.data.password)!="string") {
        this.data.password = ""
    }

    //prevent bogus properties

    this.data = {
        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    }
}
User.prototype.validate = function () {
    
    return new Promise (async(resolve, reject)=> {
        if (this.data.username == '') {
            this.errors.push('Must provide username')
        }
        if (this.data.username != '' && !validator.isAlphanumeric(this.data.username)) {
            this.errors.push('Must provide valid username')
        }
        if (!validator.isEmail(this.data.email)) {
            this.errors.push('Must valid e-mail address')
        }
        if (this.data.password == '') {
            this.errors.push('Must fill the password')
        }
        if (this.data.password.length<8 && this.data.password.length>0) {
            this.errors.push ('must minimum 8 char for password')
        }
        if (this.data.password.length>50) {
            this.errors.push ('max password 50 char')
        }
    
        if (this.data.username<4 && this.data.username>0) {
            this.errors.push ('minimum 4 char for username')
        }
        if (this.data.username>20) {
            this.errors.push ('max 20 char for username')
        }
    
         // Only if username is valid then check to see if it's already taken
         if (this.data.username.length > 4 && this.data.username.length < 21 && validator.isAlphanumeric(this.data.username)) {
            let usernameExists = await usersCollection.findOne({username: this.data.username})
            if (usernameExists) {this.errors.push("That username is already taken.")}
          }
        
          // Only if email is valid then check to see if it's already taken
          if (validator.isEmail(this.data.email)) {
            let emailExists = await usersCollection.findOne({email: this.data.email})
            if (emailExists) {this.errors.push("That email is already being used.")}
          }
          //Just UGM EMAIL BROH
          if (this.data.email.split('@').slice(1)!='ugm.ac.id') {
            this.errors.push ('Just Ugm email please')
          }
          
          resolve()
          
    })
    
    
}


User.prototype.register = function () {
    return new Promise (async (resolve, reject)=> {
        //step#1 validate data
        this.cleanUp()
        await this.validate()
        //step#2 only if there are no validation errir
        //then save user data to db
    
        if (!this.errors.length) {
            let salt =  bcrypt.genSaltSync(10)
            this.data.password = bcrypt.hashSync(this.data.password,salt)
            await usersCollection.insertOne(this.data)
            this.getAvatar()
            resolve()
        }
        else {
            reject(this.errors)
        }
    })
}

//MASIH BINGUNGGGGGGGGGGGGGGG============1=1=11=1=1=
//callback function juga bingung
//difference between callback and promise apaan?
//kayanya inti dari promise tu ngasih fungsi asyc js biar bisa jadi syc
User.prototype.login = function () {
 return new Promise ((resolve,reject) => {
    this.cleanUp()
    usersCollection.findOne({username:this.data.username}).then((attemptedUser)=> {
        if (attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
            this.data=attemptedUser
            this.getAvatar()
            resolve("congrats!")
        }
        else {
            reject("invalid username/password")
        }
    }).catch(function() {
        reject('please try again later')
    })
 })
}


User.prototype.getAvatar = function () {
    this.avatar=`https://gravatar.com/avatar/${md5(this.data.email)}?s=128`
}

User.findByUsername = function (username) {
    return new Promise (function (resolve, reject) {
        if (typeof(username)!= "string"){
            reject ()
            return
        }
        usersCollection.findOne({username: username}).then(function (userDoc) {
            if (userDoc){
                userDoc = new User (userDoc,true)
                userDoc = {
                    _id: userDoc.data._id,
                    username: userDoc.data.username,
                    avatar: userDoc.avatar 
                }
                resolve(userDoc)
            }else {
                reject()
                
            }
        }).catch (function () {
            reject ()
            
        })
    })
}

module.exports = User