(function() {
  'use strict';

  var bodyParser = require('body-parser');
  var express = require('express');
  var fs = require('fs');
  var http = require('http');
  var https = require('https');
  var Users = require('./lib/users');

  var apiHeaderField = 'X-API-Key';

  var Peruser = function(db, config, service) {
    var that = this;
    this.users = new Users(db);
    this.config = config || {};

    this.api = express();
    this.api.use(bodyParser.json());

    this.api.use(function(req, res, next) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, ' + apiHeaderField);

      next();
    });

    this.api.post('/users', this.userIsAdmin.bind(this), function(req, res) {
      that.users.crud.create(req.body, that.users.crud.rest(res));
    });

    this.api.get('/user/:uid', this.userHasUidOrIsAdmin.bind(this), function(req, res) {
      that.users.crud.read(req.params.uid, that.users.crud.rest(res));
    });

    this.api.get('/users', this.userIsAdmin.bind(this), function(req, res) {
      that.users.crud.readAll(that.users.crud.rest(res));
    });

    this.api.put('/user/:uid', this.userIsAdmin.bind(this), function(req, res) {
      that.users.crud.update(req.params.uid, req.body, that.users.crud.rest(res));
    });

    this.api.delete('/user/:uid', this.userIsAdmin.bind(this), function(req, res) {
      that.users.crud.delete(req.params.uid, that.users.crud.rest(res));
    });

    if (service) {
      this.api.get('/service', this.userIsEnabled.bind(this), function(req, res) {
        res.json(service);
      });
    }

    if (!this.config.noBind) {
      Object.keys(Peruser.prototype).forEach(function(method) {
        that[method] = Peruser.prototype[method].bind(that);
      });
    }
  };

  Peruser.prototype = {
    userIsEnabled: function(req, res, next) {
      this.users.isEnabled(req.get(apiHeaderField), function(err, enabled) {
        if (!enabled) {
          return res.status(403).end();
        }

        next();
      });
    },

    userIsAdmin: function(req, res, next) {
      this.users.isAdmin(req.get(apiHeaderField), function(err, admin) {
        if (!admin) {
          return res.status(403).end();
        }

        next();
      });
    },

    userHasUidOrIsAdmin: function(req, res, next) {
      this.users.hasUidOrIsAdmin(req.params.uid, req.get(apiHeaderField), function(err, ok) {
        if (!ok) {
          return res.status(403).end();
        }

        next();
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

      if (this.config.tls) {
        this.server = https.createServer({
          key: fs.readFileSync(this.config.tls.key),
          cert: fs.readFileSync(this.config.tls.cert)
        }, this.api);
      } else {
        this.server = http.createServer(this.api);
      }

      this.server.listen(this.config.port);
      this._started = true;
      console.log('API server started on port', this.config.port);
    }
  };

  module.exports = Peruser;

})();
