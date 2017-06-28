'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var ObjectId = Schema.Types.ObjectId
var Mixed = Schema.Types.Mixed

var CreationSchema = new mongoose.Schema({
  author: {
    type: ObjectId,
    ref: 'User'
  },

  video: {
  	type: ObjectId,
  	ref: 'Video'
  },

  audio: {
  	type: ObjectId,
  	ref: 'Audio'
  },

  title: String,
  thumbnail: String,
  cloudinary_video: String,

  finish: {
  	type: Number,
  	default: 0
  },

  votes: [String],
  like: {
    type: Number,
    default: 0
  },

  meta: {
    createAt: {
      type: Date,
      default: Date.now()
    },
    updateAt: {
      type: Date,
      default: Date.now()
    }
  }
})

CreationSchema.pre('save', function(next) {
  if (this.isNew) {
    this.meta.createAt = this.meta.updateAt = Date.now()
  } else {
    this.meta.updateAt = Date.now()
  }
  next()
})

module.exports = mongoose.model('Creation', CreationSchema)
