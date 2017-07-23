var expect = require('chai').expect;

var Module = require('../lib/module');

describe('module', function() {
  it('should return self to enable chaining', function() {
    var module = new Module;
    expect(module.value('a', 'a-value')).to.equal(module);
    expect(module.factory('b', function() {})).to.equal(module);
    expect(module.type('c', function() {})).to.equal(module);
  });
});
