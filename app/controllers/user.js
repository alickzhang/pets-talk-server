'use strict'

var mongoose = require('mongoose')
var xss = require('xss')
var User = mongoose.model('User')
var uuid = require('uuid')
var sms = require('../services/sms')

exports.signup = function* (next) {
  if (!this.request.body.phoneNumber) {
    this.body = {
      success: false,
      err: "Empty phone number"
    }
    return next
  }

  var phoneNumber = xss(this.request.body.phoneNumber.trim())

  var user = yield User.findOne({
    phoneNumber: phoneNumber
  }).exec()

  var verifyCode = sms.getCode()

  if (!user) {
    var accessToken = uuid.v4()
    user = new User({
      phoneNumber: phoneNumber,
      verifyCode: verifyCode,
      accessToken: accessToken
    })
  } else {
    user.verifyCode = verifyCode
  }

  try {
    user = yield user.save()
  } catch(err) {
    console.error(err)
    this.body = {
      success: false
    }
    return next
  }

  var msg = 'Your Verify Code is: ' + user.verifyCode

  // try {
  //   sms.send(user.phoneNumber, msg)
  // } catch(err) {
  //   console.error(err)
  //   this.body = {
  //     success: false,
  //     err: 'sms service error'
  //   }
  // }

  this.body = {
    success: true
  }
}

exports.verify = function* (next) {
  var verifyCode = this.request.body.verifyCode
  var phoneNumber = this.request.body.phoneNumber

  if (!verifyCode || !phoneNumber) {
    this.body = {
      success: false,
      err: 'Verify fail.'
    }
    return next
  }

  var user = yield User.findOne({
    phoneNumber: phoneNumber,
    verifyCode: verifyCode
  }).exec()

  if (user) {
    user.verified = true
    user = yield user.save()
    this.body = {
      success: true,
      data: {
        _id: user._id,
        nickname: user.nickname,
        accessToken: user.accessToken,
        avatar: user.avatar
      }
    }
  } else {
    this.body = {
      success: false,
      err: 'Verify fail.'
    }
  }
}

exports.update = function* (next) {
  var body = this.request.body
  var user = this.session.user

  var fields = 'avatar,gender,age,nickname,breed'.split(',')

  fields.forEach(function(field) {
    if (body[field]) {
      user[field] = xss(body[field].trim())
    }
  })

  user = yield user.save()
  this.body = {
    success: true,
    data: {
      _id: user._id,
      nickname: user.nickname,
      accessToken: user.accessToken,
      avatar: user.avatar,
      age: user.age,
      breed: user.breed,
      gender: user.gender
    }
  }
}
