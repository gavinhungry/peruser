/**
 * peruser - User authentication for quick REST APIs
 * https://github.com/gavinhungry/peruser
 */

(function() {
  'use strict';

  var bodyParser = require('body-parser');
  var express = require('express');
  var Users = require('./lib/users');

  var apiHeaderField = 'X-API-Key';

  /**
   * Constructor for Peruser API objects
   *
   * @param {Object} opts
   * @param {Object} opts.db - database table
   * @param {Number} [opts.port] - defaults to 8080
   * @param {String} [opts.serviceName]
   * @param {Boolean} [opts.noBind]
   * @param {Boolean} [opts.debugNoAuth]
   */
  var Peruser = function(opts) {
    var that = this;
    this._opts = opts || {};
    this._opts.port = this._opts.port || 8080;

    this.users = new Users(this._opts.db, opts.debugNoAuth);

    this.api = express();
    this.api.use(bodyParser.json());

    this.api.use(function(req, res, next) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, ' + apiHeaderField);

      next();
    });

    this.api.post('/users', this.userIsAdmin.bind(this), function(req, res) {
      that.users.crud.rest(that.users.crud.create(req.body), res);
    });

    this.api.get('/user/:uid', this.userHasUidOrIsAdmin.bind(this), function(req, res) {
      that.users.crud.rest(that.users.crud.readByIndex(req.params.uid), res);
    });

    this.api.get('/users', this.userIsAdmin.bind(this), function(req, res) {
      that.users.crud.rest(that.users.crud.readAll(), res);
    });

    // FIXME: Can a user change their own admin status?
    this.api.put('/user/:uid', this.userIsAdmin.bind(this), function(req, res) {
      that.users.crud.rest(that.users.crud.updateByIndex(req.params.uid, req.body), res);
    });

    this.api.delete('/user/:uid', this.userIsAdmin.bind(this), function(req, res) {
      that.users.crud.rest(that.users.crud.deleteByIndex(req.params.uid), res);
    });

    if (this._opts.serviceName) {
      this.api.get('/service', this.userIsEnabled.bind(this), function(req, res) {
        res.json(that._opts.serviceName);
      });
    }

    if (!this._opts.noBind) {
      Object.keys(Peruser.prototype).forEach(function(method) {
        that[method] = Peruser.prototype[method].bind(that);
      });
    }
  };

  Peruser.prototype = {
    userIsEnabled: function(req, res, next) {
      this.users.isEnabled(req.get(apiHeaderField)).then(function(ok) {
        return ok ? next() : res.status(403).end();
      });
    },

    userIsAdmin: function(req, res, next) {
      this.users.isAdmin(req.get(apiHeaderField)).then(function(ok) {
        return ok ? next() : res.status(403).end();
      });
    },

    userHasUidOrIsAdmin: function(req, res, next) {
      this.users.hasUidOrIsAdmin(req.get(apiHeaderField)).then(function(ok) {
        return ok ? next() : res.status(403).end();
      });
    },

    start: function() {
      if (this._started) {
        return;
      }

      this.api.use(function(req, res, next) {
        if (req.method === 'OPTIONS') {
          return next();
        }

        res.status(403).end();
      });

      this.api.listen(this._opts.port);
      this._started = true;
      console.log('API server started on port', this._opts.port);
    }
  };

  module.exports = Peruser;

})();
