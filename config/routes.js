'use strict'

var Router = require('koa-router')
var User = require('../app/controllers/user')
var Video = require('../app/controllers/video')
var Comment = require('../app/controllers/comment')
var App = require('../app/controllers/app')

module.exports = function() {
  var router = new Router({
    prefix: '/api'
  })

  // user
  router.post('/u/signup', App.hasBody, User.signup)
  router.post('/u/verify', App.hasBody, User.verify)
  router.post('/u/update', App.hasBody, App.hasToken, User.update)

  // app
  router.post('/signature', App.hasBody, App.hasToken, App.signature)

  // video
  router.post('/videos/video_upload', App.hasBody, App.hasToken, Video.video)
  router.post('/videos/audio_upload', App.hasBody, App.hasToken, Video.audio)
  router.post('/videos', App.hasBody, App.hasToken, Video.save)
  router.get('/videos', App.hasToken, Video.find)

  // comment
  router.post('/comments', App.hasBody, App.hasToken, Comment.save)
  router.get('/comments', App.hasToken, Comment.find)

  // like
  router.post('/like', App.hasBody, App.hasToken, Video.like)

  return router
}
