const { ObjectId } = require('mongodb')
const sanitizeHTML = require('sanitize-html')


let mongoObjectId = require('mongodb').ObjectId
const User = require('./User')



const postCollection = require ('../db').db().collection('post')
const followsCollection = require ('../db').db().collection('follows')



let Post = function (data, userid, requestedPostId) {
    this.data = data
    this.errors = []
    this.userid = userid
    this.requestedPostId = requestedPostId
}


Post.prototype.cleanUp = function () {
    if (typeof(this.data.title)!="string") {
        this.data = ""
    }

    if (typeof(this.data.body)!="string") {
        this.data = ""
    }
    //prevent bogus properties  
    this.data = {
        title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}}),
        body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: {}}), 
        createdDate: new Date(),
        author: ObjectId(this.userid) 
    }
}

Post.prototype.validate = function () {
    if (this.data.title == "") {
        this.errors.push("You should fill the tittle")
    }

    if (this.data.body == "") {
        this.errors.push("You should fill the body push")
    }
}

Post.prototype.create = function () {
    return new Promise ((resolve,reject)=>{
        this.cleanUp()
        this.validate()

        if (!this.errors.length) {
            postCollection.insertOne(this.data).then( (info)=>{
               resolve( info.insertedId.toString() )
                
            }).catch(()=> {
                this.errors.push('Please try again later')
                reject(this.errors)
                
            })
        }
        else {
            reject(this.errors)
            
        }
    })
}

Post.prototype.update = function () {
    return new Promise (async (resolve,reject)=>{
        try {
            let post = await Post.findSingleById(this.requestedPostId, this.userid)
            if (post.isVisitorOwner) {
                //actually update on db
                let status = await  this.actuallyUpdate()
                resolve(status)
            }else {
                reject()
            }
        }

        catch {
            reject ()
        }
    })
}

Post.prototype.actuallyUpdate = function () {
    return new Promise (async (resolve,reject)=> {
        this.cleanUp()
        this.validate()

        if (!this.errors.length) {
           await postCollection.findOneAndUpdate({_id: new ObjectId (this.requestedPostId)}, {$set:{title:this.data.title, body:this.data.body}})
            resolve('success')
        }else {
            resolve('failure')
        }
        
    })
}

Post.reusablePostQuery = function(uniqueOperations, visitorId) {
    return new Promise(async function(resolve, reject) {
      let aggOperations = uniqueOperations.concat([
        {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
        {$project: {
          title: 1,
          body: 1,
          createdDate: 1,
          authorId: "$author",
          author: {$arrayElemAt: ["$authorDocument", 0]}
        }}
      ])
  
      let posts = await postCollection.aggregate(aggOperations).toArray()
  
      // clean up author property in each post object
      posts = posts.map(function(post) {
        post.isVisitorOwner = post.authorId.equals(visitorId)
        
  
        post.author = {
          username: post.author.username,
          avatar: new User(post.author, true).avatar
        }
  
        return post
      })
  
      resolve(posts)
    })
  }

Post.findSingleById = function(id,visitorId) {
    return new Promise(async (resolve, reject)=> {
        if (typeof(id) != "string" || !ObjectId.isValid(id)) {
            reject()
            return
          }
     let posts = await Post.reusablePostQuery ([
         {$match:{_id: new ObjectId(id)}}
     ], visitorId)
      if (posts.length) {
        
        resolve(posts[0])
      } else {
        reject()
      }

     
    })
}

Post.findByAuthorId = function (authorId) {
    return Post.reusablePostQuery([
        {$match: {author: authorId}},
        {$sort: {createdDate: -1}}
    ])
}

Post.delete = function (postIdToDelete, currentUserId) {
    return new Promise (async function (resolve,reject) {
        try {
            let post = await Post.findSingleById (postIdToDelete, currentUserId)
            if (post.isVisitorOwner) {
                postCollection.deleteOne({_id:new ObjectId (postIdToDelete)})
                resolve()
            }else {
                reject ()
            }
        }
        catch {
            reject ()
        }
    })
}

Post.search = function(searchTerm) {
    return new Promise(async (resolve, reject) => {
      if (typeof(searchTerm) == "string") {
        
        let posts = await Post.reusablePostQuery([
          {$match: {$text: {$search: searchTerm}}}
         // {$sort: {createdDate: -1}}
         //{ $sort: { score: { $meta: "textScore" }, posts:-1} }
          
        ])
        resolve(posts)
      } else { 
        reject()
      }
    })
  }

  Post.counterPost = function (id){
    return new Promise (async (resolve,reject)=> {
        let postCount = await postCollection.countDocuments({author: id})
        resolve(postCount)
    })
  }

  Post.getFeed = async function (id) {
    //create  an array of the user id that current user follow
    let followedUsers = await followsCollection.find({authorId:new ObjectId(id)}).toArray()
    followedUsers=followedUsers.map(function (followDoc) {
        return followDoc.followedId
    })
    //look for post where the author is in the above array of followed user
    return Post.reusablePostQuery([
        {$match:{author:{$in: followedUsers}}},
        {$sort: {createdDate:-1}}
    ])
  }

module.exports = Post

