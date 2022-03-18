//controller for user operation (login, register, and session)


const User = require('../models/User')
const Post = require('../models/Post')
const Follow = require('../models/Follow')

exports.register = function (req,res) {
    let user = new User(req.body)
    user.register().then(()=> {
        req.flash('success', 'your registration is success')
        req.session.save (function () {
            res.redirect('/')
        })

        //this for directly user login 
       /*req.session.user = {username: user.data.username, avatar:user.avatar}
        req.session.save(function(){
            res.render('/')
        })*/
        
    }).catch((regErrors)=>{
        regErrors.forEach(function(error){
            req.flash('regErrors', error)
        })
        req.session.save(function(){
            res.redirect('/')
        })
    })

}

//ini juga pelajarin lagi soal konsep promise
exports.login = function (req,res) {
    let user = new User(req.body)
    user.login().then(function(result){
        req.session.user = {avatar:user.avatar,username:user.data.username, _id:user.data._id}
        req.session.save(function(){
            res.redirect('/')
        })
    }).catch(function (err) {
        //it will add to db req.session.flash.errors=[e]
        req.flash('errors', err)
        req.session.save(function() {
            res.redirect('/')
        })
    })
} 

exports.logout = function (req,res) {
    req.session.destroy(function(){
        res.redirect('/')
    })
    
}

exports.home = async function (req,res) {
    if (req.session.user){
        //fetching feed for the current user
        let posts = await Post.getFeed(req.session.user._id)
        res.render('home-logged-in-no-results', {posts: posts})
    }else {
        res.render('home-guest',{ regErrors:req.flash('regErrors')})
    }
}


exports.loginValidation = function (req, res, next) {
 if (req.session.user) {
     next()
 } else {
     req.flash('errors', 'you should to login first')
     req.session.save(function () {
         res.redirect('/')
     })
 }
}

exports.ifUserExist = function (req, res, next) {
    User.findByUsername(req.params.username).then(function (userDocument) {
        req.profileUser=userDocument
        next()
    }).catch(function (){
        res.render('404')
    })
   }


exports.sharedProfileData = async function (req,res,next) {
    let isVisitorProfile = false
    let isFollowing = false
    if (req.session.user) {
      isVisitorProfile = req.profileUser._id.equals(req.session.user._id)
      isFollowing =  await Follow.isVisitorFollowing (req.profileUser._id,req.visitorId)
    }
    req.isVisitorProfile = isVisitorProfile
    req.isFollowing = isFollowing

    //counter followers and following
    let postCountPromise =  Post.counterPost (req.profileUser._id)
    let followerCountPromise = Follow.counterFollower(req.profileUser._id)
    let followingCountPromise =  Follow.counterFollowing (req.profileUser._id)

    let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise,followerCountPromise,followingCountPromise])
    req.postCount = postCount
    req.followerCount =  followerCount
    req.followingCount = followingCount
    next()
}

exports.profilePostScreen = function (req, res) {

    //ask model to show post based by owner id
    Post.findByAuthorId (req.profileUser._id).then(function (posts) {
        res.render('profile', {
            currentPage: "posts",
            posts: posts,
            profileUsername:req.profileUser.username,
            profileAvatar:req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorProfile: req.isVisitorProfile,
            counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        })
    }).catch(function () {
        res.render('404')
    })
}

exports.profileFollowersScreen = async function(req, res) {
    try {
      let followers = await Follow.getFollowersById(req.profileUser._id)
      res.render('profile-followers', {
        currentPage: "followers",
        followers: followers,
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
        isFollowing: req.isFollowing,
        isVisitorProfile: req.isVisitorProfile,
        counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
      })
    } catch {
      res.render("404")
      
    }
  }

  exports.profileFollowingScreen = async function (req,res) {
      try {
        let following = await Follow.getFollowingById (req.profileUser._id)
        res.render ('profile-following', {
            currentPage: "following",
            following: following,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorProfile: req.isVisitorProfile,
            counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        })

      }catch {
        res.render('404')
      }
  }

