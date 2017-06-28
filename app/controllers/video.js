'use strict'

var mongoose = require('mongoose')
var User = mongoose.model('User')
var Video = mongoose.model('Video')
var Audio = mongoose.model('Audio')
var Creation = mongoose.model('Creation')
var xss = require('xss')
var _ = require('lodash')
var robot = require('../services/robot')
var config = require('../../config/config')

var userFields = [
  'avatar',
  'nickname',
  'gender',
  'age',
  'breed'
]

function mergeMedia(video, audio) {
  console.log('Check data...')
  if (!video || !video.public_id || !audio || !audio.public_id) {
    return
  }

  console.log('Start merging...')

  var video_public_id = video.public_id
  var audio_public_id = audio.public_id.replace(/\//g, ':')
  var videoName = video_public_id.replace(/\//g, '_') + '.mp4'
  var videoUrl = config.cloudinary.base + '/video/upload/e_volume:-100/e_volume:400,l_video:' + audio_public_id + '/' + video_public_id + '.mp4'
  var thumbnailName = video_public_id.replace(/\//g, '_') + '.jpg'
  var thumbnailUrl = config.cloudinary.base + '/video/upload/' + video_public_id + '.jpg'

  console.log(videoUrl)
  console.log(thumbnailUrl)
}

exports.like = function* (next) {
  var body = this.request.body
  var user = this.session.user
  var creation = yield Creation.findOne({
    _id: body.id
  }).exec()

  if (!creation) {
    this.body = {
      success: false,
      err: 'Empty video.'
    }
    return next
  }

  if (body.like) {
    creation.votes.push(String(user._id))
  } else {
    creation.votes = _.without(creation.votes, String(user._id))
  }

  creation.like = creation.votes.length
  yield creation.save()

  this.body = {
    success: true
  }
}

exports.find = function* (next) {
  var page = parseInt(this.query.page, 10) || 1
  var count = 5
  var offset = (page - 1) * count
  var queryArray = [
    Creation
      .find({finish: 100})
      .sort({'meta.createAt': -1})
      .skip(offset)
      .limit(count)
      .populate('author', userFields.join(' '))
      .exec(),
    Creation.count({finish: 100}).exec()
  ]

  var data = yield queryArray

  this.body = {
    success: true,
    data: data[0],
    total: data[1]
  }
}

exports.audio = function* (next) {
  var body = this.request.body
  var audioData = body.audio
  var videoId = body.videoId
  var user = this.session.user

  if (!audioData || !audioData.public_id) {
    this.body = {
      success: false,
      err: 'Fail uploading audio'
    }
    return next
  }
  console.log(audioData)
  var audio = yield Audio.findOne({
    public_id: audioData.public_id
  }).exec()

  var video = yield Video.findOne({
    _id: videoId
  }).exec()

  if (!audio) {
    var _audio = {
      author: user._id,
      public_id: audioData.public_id,
      detail: audioData
    }

    if (video) {
      _audio.video = video._id
    }

    audio = new Audio(_audio)
    audio = yield audio.save()
  }

  mergeMedia(video, audio)

  this.body = {
    success: true,
    data: audio._id
  }
}

exports.video = function* (next) {
  var body = this.request.body
  var videoData = body.video
  var user = this.session.user

  if (!videoData || !videoData.public_id) {
    this.body = {
      success: false,
      err: 'Fail uploading video.'
    }
    return next
  }
  console.log(videoData)
  var video = yield Video.findOne({
    public_id: videoData.public_id
  }).exec()

  if (!video) {
    video = new Video({
      author: user._id,
      public_id: videoData.public_id,
      detail: videoData
    })

    video = yield video.save()
  }

  this.body = {
    success: true,
    data: video._id
  }
}

exports.save = function* (next) {
  var body = this.request.body
  var videoId = body.videoId
  var audioId = body.audioId
  var title = body.title
  var user = this.session.user

  var video = yield Video.findOne({
    _id: videoId
  }).exec()

  var audio = yield Audio.findOne({
    _id: audioId
  }).exec()

  if (!video || !audio) {
    this.body = {
      success: false,
      err: 'empty video or audio'
    }

    return next
  }

  var creation = yield Creation.findOne({
    audio: audioId,
    video: videoId
  }).exec()

  if (!creation) {
    var creationData = {
      author: user._id,
      title: xss(title),
      audio: audioId,
      video: videoId,
      finish: 50
    }

    var video_public_id = video.public_id
    var audio_public_id = audio.public_id

    if (video_public_id && audio_public_id) {
      creationData.thumbnail = config.cloudinary.base + '/video/upload/' + video_public_id + '.jpg'
      creationData.cloudinary_video = config.cloudinary.base + '/video/upload/e_volume:-100/e_volume:400,l_video:' + audio_public_id.replace(/\//g, ':') + '/' + video_public_id + '.mp4'
      creationData.finish += 50
    }

    creation = new Creation(creationData)
  }

  creation = yield creation.save()
  console.log(creation)

  this.body = {
    success: true,
    data: {
      _id: creation._id,
      finish: creation.finish,
      title: creation.title,
      thumbnail: creation.thumbnail,
      cloudinary_video: creation.cloudinary_video,
      author: {
        avatar: user.avatar,
        nickname: user.nickname,
        gender: user.gender,
        breed: user.breed,
        _id: user._id
      }
    }
  }
}
