'use strict';

var _ = require('lodash');
var inflection = require('../util/inflection');
var Mixin = require('../util/mixin');

/**
 * HasMany mixin for through support.
 *
 * This mixin separates some of the logic of {@link HasMany} and is only
 * intended to be mixed into that one class.
 */
module.exports = Mixin.create(/** @lends HasMany# */ {

  /**
   * Override of {@link BaseRelation#init}.
   *
   * @method
   * @protected
   * @see {@link BaseRelation#init}
   */
  init: function(name, attributeDetails) {
    this._super.apply(this, arguments);

    // when specifying a _through_ relation, it will normally be a _through_
    // relation to a join table to set up a many to many relationship. defining
    // two `hasMany` relations every time you want to set up a many to many
    // relationship would be tedious. we therefore assume that if `through` is
    // specified, but there is no relation on the current model that matches,
    // that it's the common case of a many to many relationship, so this
    // `thorough` is to set up the join table. this code adds a has many
    // relation to the model automatically.
    var through = this._options.through;
    var modelClass = this._modelClass;
    var prototype = modelClass.__class__.prototype;
    var properties = attributeDetails.properties;
    var throughRelation = through && prototype[through + 'Relation'];
    if (through && !throughRelation && !properties[through]) {
      var hasMany = this.__identity__.attr();
      var attrs = _.object([[through, hasMany()]]);
      modelClass.reopen(attrs);
      throughRelation = prototype[through + 'Relation'];
    }
  },

  /**
   * Override of {@link HasMany#scopeObjectQuery}.
   *
   * @method
   * @protected
   * @see {@link HasMany#scopeObjectQuery}
   */
  scopeObjectQuery: function(instance, query) {
    if (!this._options.through) { return this._super.apply(this, arguments); }

    // TODO: make it so that through has-* relationships are read-only &
    // through to a single belongs-to is read-write.

    var foreignKey;
    var throughRelations = this._throughRelations();
    var joinableRelations = _.rest(throughRelations);

    joinableRelations.forEach(function(relation, index) {
      var previousRelation = throughRelations[index];
      var previousJoinName = previousRelation._name + '_through';
      var joinName = relation._name + '_through';
      foreignKey = [joinName, relation.foreignKey].join('.');
      query = query._joinRelation(joinName, previousRelation, {
        through: previousJoinName,
        reverse: true,
      });
    });

    var where = _.object([[
      foreignKey, instance.getAttribute(this.primaryKey)
    ]]);
    return query.where(where);
  },

  /**
   * Get all relations from this relation (not inclusive) to the source
   * relation (inclusive).
   *
   * @method
   * @private
   * @return {Array.<BaseRelation>}
   */
  _throughRelations: function() {
    var sourceName = this._options.source || this._name;
    var relations = [];
    var relation = this;
    while (relation) {
      var through = relation._options.through;
      var prototype = relation._modelClass.__class__.prototype;
      var throughRelation = through && prototype[through + 'Relation'];
      if (through === undefined) {
        // this is the end of the chain of through relations. it's the actual
        // source relation that we've been searching for.
        relations.unshift(relation);
        relation = null;
      }
      else if (throughRelation._options.through) {
        // a through relation to another through relation is not really through
        // any relationship at all. it's more like an alias to another property
        // on this same model that itself could be through to something else.
        relation = throughRelation;
      }
      else {
        // we're jumping over to a new model now, so we look at the related
        // model class on the through relation. we'll refer to it as the source
        // here, but it may not be the final source that we're searching for.
        // it could actually be a through relation itself, just defined on the
        // related model
        var sourceModel = throughRelation._relatedModel;
        var sourcePrototype = sourceModel.__class__.prototype;
        var sourceRelation =
          sourcePrototype[sourceName + 'Relation'] ||
          sourcePrototype[inflection.singularize(sourceName) + 'Relation'];
        relations.unshift(throughRelation);
        relation = sourceRelation;
      }
    }

    return relations;
  },

});