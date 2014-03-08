'use strict';

var request = require('request');

module.exports = function (grunt) {
  // show elapsed time at the end
  require('time-grunt')(grunt);
  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  var reloadPort = 35729, files;

 grunt.loadNpmTasks('grunt-contrib-compass');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    develop: {
      server: {
        file: 'app.js'
      }
    },
    config: {
        // Configurable paths
        pub: 'public',
        dist: 'public-dist'
    },
    watch: {
      options: {
        nospawn: true,
        livereload: reloadPort
      },
      bower: {
          files: ['bower.json'],
          tasks: ['bowerInstall']
      },
      gruntfile: {
          files: ['Gruntfile.js']
      },
      compass: {
          files: ['<%= config.pub %>/styles/{,*/}*.{scss,sass}'],
          tasks: ['compass:dev', 'autoprefixer']
      },
      server: {
        files: [
          'app.js',
          'routes/*.js'
        ],
        tasks: ['develop', 'delayed-livereload']
      }
  },

  // Empties folders to start fresh
  clean: {
      dist: {
          files: [{
              dot: true,
              src: [
                  '.tmp',
                  '<%= config.dist %>/*',
                  '!<%= config.dist %>/.git*'
              ]
          }]
      },
      server: '.tmp'
  },
  compass: {
    options: {
        sassDir: '<%= config.pub %>/styles',
        cssDir: '.tmp/styles',
        generatedImagesDir: '.tmp/images/generated',
        imagesDir: '<%= config.pub %>/images',
        javascriptsDir: '<%= config.pub %>/scripts',
        fontsDir: '<%= config.pub %>/styles/fonts',
        importPath: '<%= config.pub %>/components',
        httpImagesPath: '/images',
        httpGeneratedImagesPath: '/images/generated',
        httpFontsPath: '/styles/fonts',
        relativeAssets: false,
        assetCacheBuster: false
    },
    dev: {
      options: {
        cssDir: '<%= config.pub %>/styles',
        environment: 'development'
      }
    },
    dist: {
        options: {
            generatedImagesDir: '<%= config.dist %>/images/generated'
        }
    },
    server: {
        options: {
            debugInfo: true
        }
    }
},

// Add vendor prefixed styles
autoprefixer: {
    options: {
        browsers: ['last 1 version']
    },
    dist: {
        files: [{
            expand: true,
            cwd: '.tmp/styles/',
            src: '{,*/}*.css',
            dest: '.tmp/styles/'
        }]
    }
},

// Automatically inject Bower components into the HTML file
bowerInstall: {
    app: {
        src: ['<%= config.pub %>/index.html'],
        ignorePath: '<%= config.pub %>/',
        exclude: ['<%= config.pub %>/components/bootstrap-sass/vendor/assets/javascripts/bootstrap.js']
    },
    sass: {
        src: ['<%= config.pub %>/styles/{,*/}*.{scss,sass}'],
        ignorePath: '<%= config.pub %>/components/'
    }
},

// Renames files for browser caching purposes
rev: {
    dist: {
        files: {
            src: [
                '<%= config.dist %>/scripts/{,*/}*.js',
                '<%= config.dist %>/styles/{,*/}*.css',
                '<%= config.dist %>/images/{,*/}*.*',
                '<%= config.dist %>/styles/fonts/{,*/}*.*',
                '<%= config.dist %>/*.{ico,png}'
            ]
        }
    }
},
  // Reads HTML for usemin blocks to enable smart builds that automatically
  // concat, minify and revision files. Creates configurations in memory so
  // additional tasks can operate on them
  useminPrepare: {
      options: {
          dest: '<%= config.dist %>'
      },
      html: '<%= config.pub %>/index.html'
  },

  // Performs rewrites based on rev and the useminPrepare configuration
  usemin: {
      options: {
          assetsDirs: ['<%= config.dist %>', '<%= config.dist %>/images']
      },
      html: ['<%= config.dist %>/{,*/}*.html'],
      css: ['<%= config.dist %>/styles/{,*/}*.css']
  },

  // The following *-min tasks produce minified files in the dist folder
  imagemin: {
      dist: {
          files: [{
              expand: true,
              cwd: '<%= config.pub %>/images',
              src: '{,*/}*.{gif,jpeg,jpg,png}',
              dest: '<%= config.dist %>/images'
          }]
      }
  },

  svgmin: {
      dist: {
          files: [{
              expand: true,
              cwd: '<%= config.pub %>/images',
              src: '{,*/}*.svg',
              dest: '<%= config.dist %>/images'
          }]
      }
  },

  htmlmin: {
      dist: {
          options: {
              collapseBooleanAttributes: true,
              collapseWhitespace: true,
              removeAttributeQuotes: true,
              removeCommentsFromCDATA: true,
              removeEmptyAttributes: true,
              removeOptionalTags: true,
              removeRedundantAttributes: true,
              useShortDoctype: true
          },
          files: [{
              expand: true,
              cwd: '<%= config.dist %>',
              src: '{,*/}*.html',
              dest: '<%= config.dist %>'
          }]
      }
  },
  copy: {
    dist: {
        files: [{
            expand: true,
            dot: true,
            cwd: '<%= config.pub %>',
            dest: '<%= config.dist %>',
            src: [
                '*.{ico,png,txt}',
                '.htaccess',
                'images/{,*/}*.webp',
                '{,*/}*.html',
                'styles/fonts/{,*/}*.*',
                'components/bootstrap-sass-official/vendor/assets/fonts/bootstrap/*.*'
            ]
        }]
    },
    styles: {
        expand: true,
        dot: true,
        cwd: '<%= config.pub %>/styles',
        dest: '.tmp/styles/',
        src: '{,*/}*.css'
    }
  },
  concurrent: {
      server: [
          'compass:server',
          'copy:styles'
      ],
      test: [
          'copy:styles'
      ],
      dist: [
          'compass',
          'copy:styles',
          'imagemin',
          'svgmin'
      ]
  }


  });

  grunt.config.requires('watch.server.files');
  files = grunt.config('watch.server.files');
  files = grunt.file.expand(files);

  grunt.registerTask('delayed-livereload', 'Live reload after the node server has restarted.', function () {
    var done = this.async();
    setTimeout(function () {
      request.get('http://localhost:' + reloadPort + '/changed?files=' + files.join(','),  function (err, res) {
          var reloaded = !err && res.statusCode === 200;
          if (reloaded) {
            grunt.log.ok('Delayed live reload successful.');
          } else {
            grunt.log.error('Unable to make a delayed live reload.');
          }
          done(reloaded);
        });
    }, 500);
  });
  grunt.registerTask('build', [
        'clean:dist',
        'useminPrepare',
        'concurrent:dist',
        'autoprefixer',
        'concat',
        'cssmin',
        'uglify',
        'copy:dist',
        'rev',
        'usemin',
        'htmlmin'
    ]);

    grunt.registerTask('default', [
        'develop', 'watch'
    ]);
};
