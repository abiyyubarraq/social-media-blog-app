const express = require ('express')
const router = express.Router()
const userControllers = require('./controllers/userControllers')
const postControllers = require('./controllers/postControllers')
const followControllers = require('./controllers/followControllers')

//user route
router.get('/',userControllers.home)
router.post('/register', userControllers.register)
router.post('/login', userControllers.login )
router.post('/logout', userControllers.logout)

//post route
router.get('/create-post',userControllers.loginValidation,postControllers.viewCreateSecreen)
router.post('/create-post',userControllers.loginValidation, postControllers.create)
router.get('/post/:id', postControllers.viewSingle)
router.get('/post/:id/edit', userControllers.loginValidation ,postControllers.viewEditScreen)
router.post('/post/:id/edit', userControllers.loginValidation,postControllers.edit)
router.post('/post/:id/delete', userControllers.loginValidation, postControllers.delete)
router.post('/search', postControllers.search)

//profile route
router.get('/profile/:username', userControllers.ifUserExist,userControllers.sharedProfileData, userControllers.profilePostScreen)
router.get('/profile/:username/followers', userControllers.ifUserExist,userControllers.sharedProfileData, userControllers.profileFollowersScreen)
router.get('/profile/:username/following', userControllers.ifUserExist,userControllers.sharedProfileData, userControllers.profileFollowingScreen)


//follow route
router.post('/addFollow/:username', userControllers.loginValidation,followControllers.addFollow )
router.post('/removeFollow/:username', userControllers.loginValidation, followControllers.removeFollow )

module.exports=router