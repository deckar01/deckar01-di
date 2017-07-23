var expect = require('chai').expect;

var a = require('../lib/annotation');

describe('annotation', function() {
  describe('annotate', function() {
    var annotate = a.annotate;

    it('should set $inject property on the last argument', function() {
      var fn = function(a, b) { return [a, b]; };
      annotate('aa', 'bb', fn);
      expect(fn.$inject).to.deep.equal(['aa', 'bb']);
    });

    it('should return the function', function() {
      var fn = function(a, b) { return [a, b]; };
      expect(annotate('aa', 'bb', fn)).to.equal(fn);
    });
  });

  describe('parse', function() {
    var parse = a.parse;

    it('should parse argument names without comments', function() {
      var fn = function(one, two) { return [one, two]; };
      expect(parse(fn)).to.deep.equal(['one', 'two']);
    });

    it('should parse comment annotation', function() {
      var fn = function(/* one */ a, /*two*/ b,/*   three*/c) {
        return [a, b, c];
      };
      expect(parse(fn)).to.deep.equal(['one', 'two', 'three']);
    });

    it('should parse mixed comments with argument names', function() {
      var fn = function(/* one */ a, b,/*   three*/c) { return [a, b, c]; };
      expect(parse(fn)).to.deep.equal(['one', 'b', 'three']);
    });

    it('should parse empty arguments', function() {
      var fn = function(){};
      expect(parse(fn)).to.deep.equal([]);
    });

    it('should throw error if a number is given', function() {
      expect(function() {
        parse(123);
      }).to.throw('Can not annotate "123". Expected a function!');
    });

    it('should throw error if a string is given', function() {
      expect(function() {
        parse('abc');
      }).to.throw('Can not annotate "abc". Expected a function!');
    });

    it('should throw error if null is given', function() {
      expect(function() {
        parse(null);
      }).to.throw('Can not annotate "null". Expected a function!');
    });

    it('should throw error if undefined is given', function() {
      expect(function() {
        parse(undefined);
      }).to.throw('Can not annotate "undefined". Expected a function!');
    });

    it('should throw error if an object is given', function() {
      expect(function() {
        parse({});
      }).to.throw('Can not annotate "[object Object]". Expected a function!');
    });
  });
});
