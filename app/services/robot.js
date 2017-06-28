'use strict'

var qiniu = require('qiniu')
var cloudinary = require('cloudinary')
var Promise = require('bluebird')
var sha1 = require('sha1')
var uuid = require('uuid')
var config = require('../../config/config')

qiniu.conf.ACCESS_KEY = config.qiniu.AK
qiniu.conf.SECRET_KEY = config.qiniu.SK

cloudinary.config(config.cloudinary)

exports.getQiniuToken = function(body) {
  let type = body.type
  let putPolicy
  let key = uuid.v4()
  let options = {
    persistentNotifyUrl: config.notify
  }

  if (type === 'avatar') {
    // putPolicy.callbackUrl = 'http://your.domain.com/callback'
    // putPolicy.callbackBody = 'filename=$(fname)&filesize=$(fsize)'
    key += '.jpeg'
    putPolicy = new qiniu.rs.PutPolicy('myappavatar:' + key)
  }
  else if (type === 'video') {
    key += '.mp4'
    options.scope = 'myappvideo:' + key
    options.persistentOps = 'avthumb/mp4/an/1'
    putPolicy = new qiniu.rs.PutPolicy2(options)
  }
  else if (type === 'audio') {
  }

  const token = putPolicy.token()

  return {
    token: token,
    key: key
  }
}

exports.saveToQiniu = function(url, key) {
  var client = new qiniu.rs.Client()

  return new Promise(function(resolve, reject) {
    client.fetch(url, 'myappvideo', key, function(err, ret) {
      if (!err) {
        resolve(ret)
      }
      else {
        reject(err)
      }
    })
  })
}

exports.getCloudinaryToken = function(body) {
  const type = body.type
  const timestamp = Date.now()
  let folder
  let tags

  if (type === 'avatar') {
    folder = 'avatar'
    tags = 'app,avatar'
  } else if (type === 'video') {
    folder = 'video'
    tags = 'app,video'
  } else if (type === 'audio') {
    folder = 'audio'
    tags = 'app,audio'
  }

  let signature = 'folder=' + folder + '&tags=' + tags + '&timestamp=' + timestamp + config.cloudinary.api_secret
  signature = sha1(signature)
  const key = uuid.v4()

  return {
    signature: signature,
    timestamp: timestamp,
    key: key
  }
}

exports.uploadToCloudinary = function(url) {
  return new Promise(function(resolve, reject) {
    cloudinary.uploader.upload(url, function(result) {
      if (result && result.public_id) {
        resolve(result)
      } else {
        reject(result)
      }
    }, {
      resource_type: 'video',
      folder: 'video'
    })
  })
}
