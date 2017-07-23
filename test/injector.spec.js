var expect = require('chai').expect;

describe('injector', function() {
  var Module = require('../lib/module');
  var Injector = require('../lib/injector');

  it('should consume an object as a module', function() {
    var BazType = function() { this.name = 'baz'; };
    var module = {
      foo: [
        'factory', function() {
          return 'foo-value';
        }
      ],
      bar: ['value', 'bar-value'],
      baz: ['type', BazType]
    };
    var injector = new Injector(module);
    expect(injector.get('foo')).to.equal('foo-value');
    expect(injector.get('bar')).to.equal('bar-value');
    expect(injector.get('baz')).to.be.an['instanceof'](BazType);
  });

  it('should consume multiple objects as modules', function() {
    var BazType = function() {};
    var module1 = {
      foo: [
        'factory', function() {
          return 'foo-value';
        }
      ],
      baz: ['type', BazType]
    };
    var module2 = {
      bar: ['value', 'bar-value']
    };
    var injector = new Injector([module1, module2]);
    expect(injector.get('foo')).to.equal('foo-value');
    expect(injector.get('bar')).to.equal('bar-value');
    expect(injector.get('baz')).to.be.an['instanceof'](BazType);
  });

  describe('get', function() {
    it('should return an instance', function() {
      var BazType = function() { this.name = 'baz'; };
      var module = new Module;
      module.factory('foo', function() {
        return {
          name: 'foo'
        };
      });
      module.value('bar', 'bar value');
      module.type('baz', BazType);
      var injector = new Injector([module]);
      expect(injector.get('foo')).to.deep.equal({
        name: 'foo'
      });
      expect(injector.get('bar')).to.equal('bar value');
      expect(injector.get('baz')).to.deep.equal({
        name: 'baz'
      });
      expect(injector.get('baz')).to.be.an['instanceof'](BazType);
    });

    it('should always return the same instance', function() {
      var BazType = function() { this.name = 'baz'; };
      var module = new Module;
      module.factory('foo', function() {
        return {
          name: 'foo'
        };
      });
      module.value('bar', 'bar value');
      module.type('baz', BazType);
      var injector = new Injector([module]);
      expect(injector.get('foo')).to.equal(injector.get('foo'));
      expect(injector.get('bar')).to.equal(injector.get('bar'));
      expect(injector.get('baz')).to.equal(injector.get('baz'));
    });

    it('should resolve dependencies', function() {
      var Foo = function(bar1, baz1) {
        this.bar = bar1;
        this.baz = baz1;
      };
      Foo.$inject = ['bar', 'baz'];
      var bar = function(baz, abc) {
        return {
          baz: baz,
          abc: abc
        };
      };
      bar.$inject = ['baz', 'abc'];
      var module = new Module;
      module.type('foo', Foo);
      module.factory('bar', bar);
      module.value('baz', 'baz-value');
      module.value('abc', 'abc-value');
      var injector = new Injector([module]);
      var fooInstance = injector.get('foo');
      expect(fooInstance.bar).to.deep.equal({
        baz: 'baz-value',
        abc: 'abc-value'
      });
      expect(fooInstance.baz).to.equal('baz-value');
    });

    it('should inject properties', function() {
      var module = new Module;
      module.value('config', {
        a: 1,
        b: {
          c: 2
        }
      });
      var injector = new Injector([module]);
      expect(injector.get('config.a')).to.equal(1);
      expect(injector.get('config.b.c')).to.equal(2);
    });

    it('should inject dotted service if present', function() {
      var module = new Module;
      module.value('a.b', 'a.b value');
      var injector = new Injector([module]);
      expect(injector.get('a.b')).to.equal('a.b value');
    });

    it('should provide "injector"', function() {
      var module = new Module;
      var injector = new Injector([module]);
      expect(injector.get('injector')).to.equal(injector);
    });

    it('should throw error with full path if no provider', function() {
      var aFn = function(b) {
        return b;
      };
      aFn.$inject = ['b'];
      var bFn = function(c) {
        return c;
      };
      bFn.$inject = ['c'];
      var module = new Module;
      module.factory('a', aFn);
      module.factory('b', bFn);
      var injector = new Injector([module]);
      expect(function() {
        injector.get('a');
      }).to.throw('No provider for "c"! (Resolving: a -> b -> c)');
    });

    it('should throw error if circular dependency', function() {
      var aFn = function(b) {
        return b;
      };
      aFn.$inject = ['b'];
      var bFn = function(a) {
        return a;
      };
      bFn.$inject = ['a'];
      var module = new Module;
      module.factory('a', aFn);
      module.factory('b', bFn);
      var injector = new Injector([module]);
      expect(function() {
        injector.get('a');
      }).to.throw('Can not resolve circular dependency! ' + '(Resolving: a -> b -> a)');
    });
  });

  describe('invoke', function() {
    it('should resolve dependencies', function() {
      var bar = function(baz, abc) {
        return {
          baz: baz,
          abc: abc
        };
      };
      bar.$inject = ['baz', 'abc'];
      var module = new Module;
      module.value('baz', 'baz-value');
      module.value('abc', 'abc-value');
      var injector = new Injector([module]);
      expect(injector.invoke(bar)).to.deep.equal({
        baz: 'baz-value',
        abc: 'abc-value'
      });
    });

    it('should invoke function on given context', function() {
      var context = {};
      var module = new Module;
      var injector = new Injector([module]);
      injector.invoke((function() {
        expect(this).to.equal(context);
      }), context);
    });

    it('should throw error if a number is given', function() {
      var injector = new Injector([]);
      expect(function() {
        injector.invoke(123);
      }).to.throw('Can not invoke "123". Expected a function!');
    });

    it('should throw error if a string is given', function() {
      var injector = new Injector([]);
      expect(function() {
        injector.invoke('abc');
      }).to.throw('Can not invoke "abc". Expected a function!');
    });

    it('should throw error if null is given', function() {
      var injector = new Injector([]);
      expect(function() {
        injector.invoke(null);
      }).to.throw('Can not invoke "null". Expected a function!');
    });

    it('should throw error if undefined given', function() {
      var injector = new Injector([]);
      expect(function() {
        injector.invoke(undefined);
      }).to.throw('Can not invoke "undefined". ' + 'Expected a function!');
    });

    it('should throw error if an object is given', function() {
      var injector = new Injector([]);
      expect(function() {
        injector.invoke({});
      }).to.throw('Can not invoke "[object Object]". ' + 'Expected a function!');
    });

    it('should auto parse arguments/comments if no $inject defined', function() {
      var bar = function(/* baz */ a, abc) {
        return {baz: a, abc: abc};
      };
      var module = new Module;
      module.value('baz', 'baz-value');
      module.value('abc', 'abc-value');
      var injector = new Injector([module]);
      expect(injector.invoke(bar)).to.deep.equal({
        baz: 'baz-value',
        abc: 'abc-value'
      });
    });
  });

  describe('instantiate', function() {
    it('should resolve dependencies', function() {
      var Foo = function(abc1, baz1) {
        this.abc = abc1;
        this.baz = baz1;
      };
      Foo.$inject = ['abc', 'baz'];
      var module = new Module;
      module.value('baz', 'baz-value');
      module.value('abc', 'abc-value');
      var injector = new Injector([module]);
      expect(injector.instantiate(Foo)).to.deep.equal({
        abc: 'abc-value',
        baz: 'baz-value'
      });
    });

    it('should return returned value from constructor if an object returned', function() {
      var module = new Module;
      var injector = new Injector([module]);
      var returnedObj = {};
      var ObjCls = function() {
        return returnedObj;
      };
      var StringCls = function() {
        return 'some string';
      };
      var NumberCls = function() {
        return 123;
      };
      expect(injector.instantiate(ObjCls)).to.equal(returnedObj);
      expect(injector.instantiate(StringCls)).to.be.an['instanceof'](StringCls);
      expect(injector.instantiate(NumberCls)).to.be.an['instanceof'](NumberCls);
    });
  });

  describe('child', function() {
    it('should inject from child', function() {
      var moduleParent = new Module;
      moduleParent.value('a', 'a-parent');
      var moduleChild = new Module;
      moduleChild.value('a', 'a-child');
      moduleChild.value('d', 'd-child');
      var injector = new Injector([moduleParent]);
      var child = injector.createChild([moduleChild]);
      expect(child.get('d')).to.equal('d-child');
      expect(child.get('a')).to.equal('a-child');
    });

    it('should provide the child injector as "injector"', function() {
      var injector = new Injector([]);
      var childInjector = injector.createChild([]);
      expect(childInjector.get('injector')).to.equal(childInjector);
    });

    it('should inject from parent if not provided in child', function() {
      var moduleParent = new Module;
      moduleParent.value('a', 'a-parent');
      var moduleChild = new Module;
      moduleChild.factory('b', function(a) {
        return {
          a: a
        };
      });
      var injector = new Injector([moduleParent]);
      var child = injector.createChild([moduleChild]);
      expect(child.get('b')).to.deep.equal({
        a: 'a-parent'
      });
    });

    it('should inject from parent but never use dependency from child', function() {
      var moduleParent = new Module;
      moduleParent.factory('b', function(c) {
        return c;
      });
      var moduleChild = new Module;
      moduleChild.value('c', 'c-child');
      var injector = new Injector([moduleParent]);
      var child = injector.createChild([moduleChild]);
      expect(function() {
        child.get('b');
      }).to.throw('No provider for "c"! (Resolving: b -> c)');
    });

    it('should force new instance in child', function() {
      var moduleParent = new Module;
      moduleParent.factory('b', function(c) {
        return {
          c: c
        };
      });
      moduleParent.value('c', 'c-parent');
      var injector = new Injector([moduleParent]);
      expect(injector.get('b')).to.deep.equal({
        c: 'c-parent'
      });
      var moduleChild = new Module;
      moduleChild.value('c', 'c-child');
      var child = injector.createChild([moduleChild], ['b']);
      expect(child.get('b')).to.deep.equal({
        c: 'c-child'
      });
    });

    it('should force new instance using provider from grand parent', function() {
      var moduleGrandParent = new Module;
      moduleGrandParent.value('x', 'x-grand-parent');
      var injector = new Injector([moduleGrandParent]);
      injector.createChild([]).createChild([], ['x']);
    });

    it('should throw error if forced provider does not exist', function() {
      var moduleParent = new Module;
      var injector = new Injector([moduleParent]);
      expect(function() {
        injector.createChild([], ['b']);
      }).to.throw('No provider for "b". Can not use provider from the parent!');
    });
  });

  describe('private modules', function() {
    it('should only expose public bindings', function() {
      var mA = {
        __exports__: ['publicFoo'],
        'publicFoo': [
          'factory', function(privateBar) {
            return {
              dependency: privateBar
            };
          }
        ],
        'privateBar': ['value', 'private-value']
      };
      var mB = {
        'bar': [
          'factory', function(privateBar) {
            return privateBar;
          }
        ],
        'baz': [
          'factory', function(publicFoo) {
            return {
              dependency: publicFoo
            };
          }
        ]
      };
      var injector = new Injector([mA, mB]);
      var publicFoo = injector.get('publicFoo');
      expect(publicFoo).to.be.defined;
      expect(publicFoo.dependency).to.equal('private-value');
      expect(function() {
        injector.get('privateBar');
      }).to.throw('No provider for "privateBar"! (Resolving: privateBar)');
      expect(function() {
        injector.get('bar');
      }).to.throw('No provider for "privateBar"! (Resolving: bar -> privateBar)');
      expect(injector.get('baz').dependency).to.equal(publicFoo);
    });

    it('should allow name collisions in private bindings', function() {
      var mA = {
        __exports__: ['foo'],
        'foo': [
          'factory', function(conflict) {
            return conflict;
          }
        ],
        'conflict': ['value', 'private-from-a']
      };
      var mB = {
        __exports__: ['bar'],
        'bar': [
          'factory', function(conflict) {
            return conflict;
          }
        ],
        'conflict': ['value', 'private-from-b']
      };
      var injector = new Injector([mA, mB]);
      expect(injector.get('foo')).to.equal('private-from-a');
      expect(injector.get('bar')).to.equal('private-from-b');
    });

    it('should allow forcing new instance', function() {
      var module = {
        __exports__: ['foo'],
        'foo': [
          'factory', function(bar) {
            return {
              bar: bar
            };
          }
        ],
        'bar': ['value', 'private-bar']
      };
      var injector = new Injector([module]);
      var firstChild = injector.createChild([], ['foo']);
      var secondChild = injector.createChild([], ['foo']);
      var fooFromFirstChild = firstChild.get('foo');
      var fooFromSecondChild = secondChild.get('foo');
      expect(fooFromFirstChild).not.to.equal(fooFromSecondChild);
      expect(fooFromFirstChild.bar).to.equal(fooFromSecondChild.bar);
    });

    it('should load additional __modules__', function() {
      var mB = {
        'bar': ['value', 'bar-from-other-module']
      };
      var mA = {
        __exports__: ['foo'],
        __modules__: [mB],
        'foo': [
          'factory', function(bar) {
            return {
              bar: bar
            };
          }
        ]
      };
      var injector = new Injector([mA]);
      var foo = injector.get('foo');
      expect(foo).to.be.defined;
      expect(foo.bar).to.equal('bar-from-other-module');
    });

    it('should only create one private child injector', function() {
      var m = {
        __exports__: ['foo', 'bar'],
        'foo': [
          'factory', function(bar) {
            return {
              bar: bar
            };
          }
        ],
        'bar': [
          'factory', function(internal) {
            return {
              internal: internal
            };
          }
        ],
        'internal': [
          'factory', function() {
            return {};
          }
        ]
      };
      var injector = new Injector([m]);
      var foo = injector.get('foo');
      var bar = injector.get('bar');
      var childInjector = injector.createChild([], ['foo', 'bar']);
      var fooFromChild = childInjector.get('foo');
      var barFromChild = childInjector.get('bar');
      expect(fooFromChild).to.not.equal(foo);
      expect(barFromChild).to.not.equal(bar);
      expect(fooFromChild.bar).to.equal(barFromChild);
    });
  });

  describe('scopes', function() {
    it('should force new instances per scope', function() {
      var Foo = function() {};
      Foo.$scope = ['request'];
      var createBar = function() {
        return {};
      };
      createBar.$scope = ['session'];
      var m = {
        'foo': ['type', Foo],
        'bar': ['factory', createBar]
      };
      var injector = new Injector([m]);
      var foo = injector.get('foo');
      var bar = injector.get('bar');
      var sessionInjector = injector.createChild([], ['session']);
      expect(sessionInjector.get('foo')).to.equal(foo);
      expect(sessionInjector.get('bar')).to.not.equal(bar);
      var requestInjector = injector.createChild([], ['request']);
      expect(requestInjector.get('foo')).to.not.equal(foo);
      expect(requestInjector.get('bar')).to.equal(bar);
    });
  });
});
