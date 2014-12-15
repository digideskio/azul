'use strict';

var chai = require('chai');
var expect = chai.expect;

var Database = require('../../lib/database');
var FakeAdapter = require('../fakes/adapter');

require('../helpers/model');

var db,
  adapter,
  Employee;

describe('Model self-joins', function() {
  beforeEach(function() {
    adapter = FakeAdapter.create({});
    db = Database.create({ adapter: adapter });

    var hasMany = db.hasMany;
    var belongsTo = db.belongsTo;

    Employee = db.model('employee').reopen({
      subordinates: hasMany('employee', { inverse: 'manager' }),
      manager: belongsTo('employee', { inverse: 'subordinates' })
    });
  });

  describe('belongsTo', function() {
    it('generates the proper sql', function(done) {
      Employee.objects.join('manager').where({ id: 1 }).then(function() {
        expect(adapter.executedSQL()).to.eql([
          ['SELECT * FROM "employees" ' +
           'INNER JOIN "employees" "manager" ' +
           'ON "employees"."manager_id" = "manager"."id" ' +
           'WHERE "employees"."id" = ?', [1]]
        ]);
      })
      .done(done, done);
    });

    it('uses the correct table when where uses relation', function(done) {
      Employee.objects.where({ 'manager.id': 1 }).then(function() {
        expect(adapter.executedSQL()).to.eql([
          ['SELECT * FROM "employees" ' +
           'INNER JOIN "employees" "manager" ' +
           'ON "employees"."manager_id" = "manager"."id" ' +
           'WHERE "manager"."id" = ?', [1]]
        ]);
      })
      .done(done, done);
    });

    it('expands attributes', function(done) {
      Employee.objects.where({ 'manager.pk': 1 }).then(function() {
        expect(adapter.executedSQL()).to.eql([
          ['SELECT * FROM "employees" ' +
           'INNER JOIN "employees" "manager" ' +
           'ON "employees"."manager_id" = "manager"."id" ' +
           'WHERE "manager"."id" = ?', [1]]
        ]);
      })
      .done(done, done);
    });
  });

  describe('hasMany', function() {
    it('generates the proper sql', function(done) {
      Employee.objects.join('subordinates').where({ id: 1 }).then(function() {
        expect(adapter.executedSQL()).to.eql([
          ['SELECT * FROM "employees" ' +
           'INNER JOIN "employees" "subordinates" ' +
           'ON "employees"."id" = "subordinates"."manager_id" ' +
           'WHERE "employees"."id" = ?', [1]]
        ]);
      })
      .done(done, done);
    });

    it('uses the correct table when where uses relation', function(done) {
      Employee.objects.where({ 'subordinates.id': 1 }).then(function() {
        expect(adapter.executedSQL()).to.eql([
          ['SELECT * FROM "employees" ' +
           'INNER JOIN "employees" "subordinates" ' +
           'ON "employees"."id" = "subordinates"."manager_id" ' +
           'WHERE "subordinates"."id" = ?', [1]]
        ]);
      })
      .done(done, done);
    });

    it('expands attributes', function(done) {
      Employee.objects.where({ 'subordinates.pk': 1 }).then(function() {
        expect(adapter.executedSQL()).to.eql([
          ['SELECT * FROM "employees" ' +
           'INNER JOIN "employees" "subordinates" ' +
           'ON "employees"."id" = "subordinates"."manager_id" ' +
           'WHERE "subordinates"."id" = ?', [1]]
        ]);
      })
      .done(done, done);
    });
  });
});
