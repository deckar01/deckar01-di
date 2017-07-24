var esprima = require('esprima');

var annotate = function() {
  var args = Array.prototype.slice.call(arguments);
  var fn = args.pop();

  fn.$inject = args;

  return fn;
};


var parse = function(fn) {
  if (typeof fn !== 'function') {
    throw new Error('Can not annotate "' + fn + '". Expected a function!');
  }

  // Use surrounding parenthesis since prima does not parse anonymous
  // functions at the top level.
  var source = '(' + fn.toString() + ')';
  var ast = esprima.parse(source);
  var args = ast.body[0].expression.params;

  // Check the function for a block comment just before the argument name
  // and use that name instead.
  var tokens = esprima.tokenize(source, {comment: true});
  var argNames = args.map(function(arg) {
    var tokenIndex = tokens.findIndex(function(t) {
      return t.type == 'Identifier' && t.value == arg.name;
    });
    var previousToken = tokens[tokenIndex - 1];
    if(previousToken.type == 'BlockComment') {
      return previousToken.value.trim();
    } else {
      return arg.name;
    }
  });
  return argNames;
};


exports.annotate = annotate;
exports.parse = parse;
