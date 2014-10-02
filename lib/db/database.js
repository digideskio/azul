'use strict';

var Class = require('../util/class');
var Query = require('./query');

/**
 * @since 1.0
 * @public
 * @constructor
 */
var Database = Class.extend({

  /**
   * @callback Database~initCallback
   * @param {Error} err The error, if one occurred.
   * @param {Database} db The database instance.
   */

  /**
   * Create a new database.
   *
   * @alias Database
   * @param {Object} connection The connection information.
   * @param {String} connection.adapter The adapter to use. Possible choices
   * are:
   *   - pg
   *   - mysql
   *   - sqlite
   * @param {String} connection.database The database to connect to.
   * @param {String} connection.username The username to connect with.
   * @param {String} connection.password The password to connect with.
   * @param {Database~initCallback} [cb] The callback to call when connected.
   */
  init: function(connection, cb) {
    // TODO: convert to promises
    if (!connection) { throw new Error('Missing connection information.'); }
    cb = cb || function() {};

    var Adapter;
    if (typeof connection.adapter === 'function') {
      Adapter = connection.adapter;
    }
    if (!Adapter) {
      try { Adapter = require('./adapters/' + connection.adapter); }
      catch (e) {
        if (e.code === 'MODULE_NOT_FOUND') {
          throw new Error('No adapter found for ' + connection.adapter);
        }
        else { throw e; }
      }
    }
    this._adapter = new Adapter();
    this._query = new Query(this._adapter);

    this._adapter.connect(connection, function(err) {
      if (err) { return cb(err); }
      cb(null, this);
    }.bind(this));
  }
});

/**
 * Documentation forthcoming.
 *
 * @private
 * @function
 */
var query = function(name) {
  return function() {
    return this._query[name].apply(this._query, arguments);
  };
};

/**
 * Documentation forthcoming.
 *
 * @since 1.0
 * @public
 * @method
 */
Database.prototype.select = query('select');

Database.reopenClass({ __name__: 'Database' });
module.exports = Database;