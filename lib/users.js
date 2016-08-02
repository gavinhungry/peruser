(function() {
  'use strict';

  var Rudiment = require('rudiment');
  var schema = require('js-schema');

  var Users = function(db) {
    this.crud = new Rudiment({
      db: db,
      path: 'user',
      schema: schema({
        uid: String.of(8, null),
        key: String.of(40, null),
        name: String.of(3, 20, null),
        admin: Boolean,
        enabled: Boolean
      })
    });
  };

  Users.prototype = {
    _firstMatchIs: function(params, filter, callback) {
      this.crud.find(params || {}, function(err, users) {
        if (err) {
          return callback(err);
        }

        if (!users.length) {
          return callback(null, false);
        }

        callback(null, users[0] && filter(users[0]));
      });
    },

    /**
     * Get the enabled status of a user
     *
     * @param {String} key - API key
     * @param {Function} callback (err, {Boolean})
     */
    isEnabled: function(key, callback) {
      this._firstMatchIs({
        key: key
      }, function(user) {
        return user.enabled;
      }, callback);
    },

    /**
     * Get the admin status of a user
     *
     * Only an enabled user can be considered a valid admin
     *
     * @param {String} key - API key
     * @param {Function} callback (err, {Boolean})
     */
    isAdmin: function(key, callback) {
      this._firstMatchIs({
        key: key
      }, function(user) {
        return user.enabled && user.admin;
      }, callback);
    },

    /**
     * Get the user view right status
     *
     * @param {String} uid
     * @param {String} key - API key
     * @param {Function} callback (err, {Boolean})
     */
    hasUidOrIsAdmin: function(uid, key, callback) {
      this._firstMatchIs({
        key: key
      }, function(user) {
        return user.enabled && (user.uid === uid || user.admin);
      }, callback);
    }
  };

  module.exports = Users;

})();
