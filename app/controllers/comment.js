'use strict'

var mongoose = require('mongoose')
var Creation = mongoose.model('Creation')
var Comment = mongoose.model('Comment')

var userFields = [
  'avatar',
  'nickname',
  'gender',
  'age',
  'breed'
]

exports.find = function* (next) {
  console.log(this.query)
  var id = this.query.id
  if (!id) {
    this.body = {
      success: false,
      err: 'Empty ID.'
    }
    return next
  }

  var queryArray = [
    Comment.find({
      video: id
    })
    .populate('commentFrom', userFields.join(' '))
    .sort({'meta.createAt': -1})
    .exec(),
    Comment.count({video: id}).exec()
  ]

  var data = yield queryArray
  console.log(data)

  this.body = {
    success: true,
    data: data[0],
    total: data[1]
  }
}

exports.save = function* (next) {
  console.log(this.request.body)
  var commentData = this.request.body.comment
  var user = this.session.user
  console.log(commentData.video)
  var creation = yield Creation.findOne({
    _id: commentData.video
  }).exec()

  console.log(creation)

  if (!creation) {
    this.body = {
      success: false,
      err: 'Empty video.'
    }
    return next
  }

  var comment

  if (commentData.cid) {
    comment = yield Comment.findOne({
      _id: commentData.cid
    }).exec()

    var reply = {
      from: commentData.from,
      to: commentData.tid,
      content: commentData.content
    }

    comment.comments.push(reply)
    comment = yield comment.save()

    this.body = {
      success: true
    }
  } else {
    comment = new Comment({
      video: creation._id,
      commentFrom: user,
      author: creation.author,
      content: commentData.content
    })
    comment = yield comment.save()

    console.log(comment)

    this.body = {
      success: true,
      data: [comment]
    }
  }
}
