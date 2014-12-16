'use strict';

var Mixin = require('../util/mixin');

/**
 * BelongsTo mixin for joining.
 *
 * This mixin separates some of the logic of {@link BelongsTo} and is only
 * intended to be mixed into that one class.
 */
module.exports = Mixin.create(/** @lends BelongsTo# */ {

  /**
   * Override of {@link BaseRelation#joinCondition}.
   *
   * @method
   * @protected
   * @see {@link BaseRelation#joinCondition}
   */
  joinCondition: function(baseTable, joinTable) {
    var fk = [baseTable, this.foreignKey].join('.');
    var pk = [joinTable, this.primaryKey].join('.');
    return [fk, pk].join('=');
  }

});