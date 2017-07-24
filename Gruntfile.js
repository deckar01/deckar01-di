module.exports = function(grunt) {
  grunt.initConfig({
    pkgFile: 'package.json',
    files: {
      source: ['lib/*.js']
    },
    test: {
      unit: 'mochaTest:unit'
    },
    mochaTest: {
      options: {
        ui: 'bdd',
        reporter: 'dot'
      },
      unit: {
        src: ['test/*.spec.js']
      }
    },
    eslint: {
      target: ['test', 'lib', '*.js']
    }
  });

  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-eslint');

  grunt.registerTask('default', ['eslint', 'test']);
  grunt.registerTask('test', ['mochaTest']);
};
