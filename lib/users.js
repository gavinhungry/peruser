(function() {
  'use strict';

  var Rudiment = require('rudiment');
  var schema = require('js-schema');

  var Users = function(db) {
    this.crud = new Rudiment({
      db: db,
      path: 'user',
      schema: schema({
        uid: String.of(40, null),
        name: String.of(3, 20, null),
        admin: Boolean,
        enabled: Boolean
      })
    });
  };

  Users.prototype = {
    /**
     * Get the enabled status of a user
     *
     * @param {String} uid
     * @param {Function} callback (err, {Boolean})
     */
    isEnabled: function(uid, callback) {
      this.crud.read(uid, function(err, user) {
        if (err) {
          callback(err);
          return;
        }

        callback(null, user && user.enabled);
      });
    },

    /**
     * Get the admin status of a user
     *
     * Only an enabled user can be considered a valid admin
     *
     * @param {String} uid
     * @param {Function} callback (err, {Boolean})
     */
    isAdmin: function(uid, callback) {
      var that = this;

      this.isEnabled(uid, function(err, enabled) {
        if (err) {
          callback(err);
          return;
        }

        if (!enabled) {
          return callback(null, false);
        }

        that.crud.read(uid, function(err, user) {
          if (err) {
            callback(err);
            return;
          }

          callback(null, user && user.admin);
        });
      });
    }
  };

  module.exports = Users;

})();
