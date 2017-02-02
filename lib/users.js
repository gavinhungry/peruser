/**
 * peruser - User authentication for quick REST APIs
 * https://github.com/gavinhungry/peruser
 */

(function() {
  'use strict';

  var Rudiment = require('rudiment');
  var schema = require('js-schema');

  var Users = function(db, debugNoAuth) {
    if (debugNoAuth) {
      this._debugNoAuth = true;
    }

    this.crud = new Rudiment({
      db: db,
      schema: schema({
        name: String.of(3, 20, null),
        apiKey: String.of(40, null),
        admin: Boolean,
        enabled: Boolean
      }),

      key: 'apiKey',
      index: 'uid',
      path: 'user'
    });
  };

  Users.prototype = {
    _keyIs: function(key, predicate) {
      if (this._debugNoAuth) {
        return Promise.resolve(true);
      }

      return this.crud.readByKey(key).then(function(user) {
        return typeof predicate === 'function' ? predicate(user) : false;
      }, function(err) {
        return false;
      });
    },

    /**
     * Get the enabled state of a user by API key
     *
     * @param {String} apiKey - API key
     * @return {Promise} -> {Boolean}
     */
    isEnabled: function(apiKey) {
      return this._keyIs(apiKey, function(user) {
        return user.enabled;
      });
    },

    /**
     * Get the admin state of a user by API key
     *
     * Only an enabled user can be considered a valid admin
     *
     * @param {String} apiKey - API key
     * @return {Promise} -> {Boolean}
     */
    isAdmin: function(apiKey) {
      return this._keyIs(apiKey, function(user) {
        return user.enabled && user.admin;
      });
    },

    /**
     * Get the readable state of a user by API key and user index
     *
     * @param {String} apiKey - API key
     * @param {String} uid
     * @return {Promise} -> {Boolean}
     */
    hasUidOrIsAdmin: function(apiKey, uid) {
      return this._keyIs(apiKey, function(user) {
        return user.enabled && (user.uid === uid || user.admin);
      });
    }
  };

  module.exports = Users;

})();
