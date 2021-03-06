"use strict";

var createUser = require('../../db/createUser.js');
var getUser = require('../../db/getUser.js');

module.exports = {

  logout: function (req, res) {
    res.json({
      loggedIn: false
    });
  },
  createUser: function(req, res, next) {
    var facebookId;
    var name = req.body.name,
        profPhoto = req.body.profPhoto,
        email = req.body.email,
        facebookToken = req.body.facebookToken;
    if (!!req.body.facebookId){
      facebookId = req.body.facebookId;
    } else {
      facebookId = req.user.facebookId;
    }

    createUser(facebookId, name, email, profPhoto, facebookToken, function (err, user){
      if (err){
        next(err);
      } else {
        res.json(user);
      }
    });
  },
  getUser: function(req, res, next) {
    var facebookId;
    if (!!req.headers.facebookid){
      facebookId = req.headers.facebookid;
    } else {
      facebookId = req.user.facebookId;
    }
    getUser(facebookId, function (err, user){
      if (err){
        next(err);
      } else {
        res.json(user);
      }
    });
  }
}