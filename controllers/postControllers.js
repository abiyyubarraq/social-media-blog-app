const Post = require('../models/Post')


exports.viewCreateSecreen = function (req,res) {
    res.render('create-post')
}


exports.create = function (req,res) {
    let post = new Post (req.body, req.session.user._id)
    post.create().then(function (newId){
        req.flash('success', 'Your post succesfully created.')
        req.session.save(function () {
            res.redirect (`/post/${newId}`)
           
        })
    }).catch(function(errors) {
        errors.forEach ( error=>req.flash('errors',error))
        req.session.save(() =>{
            res.redirect('/create-post')
           
        })
    })
}

exports.viewSingle = async (req, res)=> {
    try {
        let post = await Post.findSingleById(req.params.id, req.visitorId)
        res.render('single-post-screen', {post: post})
      } catch {
        res.render('404')
      }
   
  }

  exports.viewEditScreen = async function (req,res) {
    try {
        let post = await Post.findSingleById(req.params.id)
        if (post.authorId == req.visitorId) { 
            res.render('edit-post', {post:post})
        } else {
            req.flash('errors', 'You have no permission')
            req.session.save(function () {
                res.redirect('/')
            })
        }

    }
    

    catch {
        res.render('404')
    }
  }


  exports.edit = function (req,res) {
    let post = new Post (req.body, req.visitorId, req.params.id)
    post.update ().then(function (status) {
        //the post was success update the database
        //or user have permision but the validation is error
        if (status == 'success') {
            //post updated to db
            req.flash('success', "post succesfully updated")
            req.session.save(function () {
                res.redirect(`/post/${req.params.id}`)
            })
        }else {
            post.errors.forEach (function (error) {
                req.flash("errors", error)
            })
            req.session.save(function () {
                res.redirect(`/post/${req.params.id}/edit`)
            })
        }
    }).catch(function () {
        //if post with request id didnt exist
        //or if current visitor not the owner of the post

        req.flash("errors", "you have no permission")
        req.session.save(function () {
            res.redirect ('/')
        })
    })
  }

  exports.delete = function (req,res) {
    Post.delete (req.params.id,req.visitorId).then(function () {
        req.flash('success', 'Post succesfully Deleted')
        req.session.save(function () {
            res.redirect(`/profile/${req.session.user.username}`)
        })
    }).catch(function() {
        req.flash('errors', 'You have no permission')
        req.session.save(function () {
            res.redirect('/')
        })
    })  
  }

  exports.search = function(req, res) {
    Post.search(req.body.searchTerm).then(posts => {
      res.json(posts)
    }).catch(() => {
      res.json([])
    })
  }
