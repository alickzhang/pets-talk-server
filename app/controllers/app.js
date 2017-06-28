'use strict'

var mongoose = require('mongoose')
var User = mongoose.model('User')
var robot = require('../services/robot')

exports.signature = function* (next) {
  var body = this.request.body
  var data = robot.getCloudinaryToken(body)
  
  this.body = {
    success: true,
    data: data
  }
}

exports.hasToken = function* (next) {
  var accessToken = this.query.accessToken

  if (!accessToken) {
    accessToken = this.request.body.accessToken
  }

  if (!accessToken) {
    this.body = {
      success: false,
      err: 'Token does not exist.'
    }
    return next
  }

  var user = yield User.findOne({
    accessToken: accessToken
  }).exec()

  if (!user) {
    this.body = {
      success: false,
      err: 'User does not login.'
    }
    return next
  }

  this.session = this.session || {}
  this.session.user = user

  yield next
}

exports.hasBody = function* (next) {
  var body = this.request.body || {}

  if (Object.keys(body).length === 0) {
    this.body = {
      success: false,
      err: 'Missing fields.'
    }
    return next
  }
  yield next
}
