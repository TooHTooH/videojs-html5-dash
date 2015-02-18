'use strict';

// TODO: Fix watch task to work w/jshint, etc.
module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
            '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
            '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>;' +
            ' Licensed <%= pkg.license %> */\n',
        clean: {
            files: ['dist']
        },
        browserify: {
            dist: {
                src: 'src/js/main.js',
                dest: 'dist/vjs-html5-dash.js'
            },
            dev: {
                src: 'src/js/main.js',
                dest: 'dist/vjs-html5-dash-debug.js',
                options: {
                    browserifyOptions: {
                        debug: true
                    }
                }
            },
            test: {
              src: 'test/main.js',
              dest: 'dist/tests.js'
            }
        },
        jshint: {
            gruntfile: {
                options: {
                    node: true
                },
                src: 'Gruntfile.js'
            },
            src: {
                options: {
                    jshintrc: '.jshintrc'
                },
                src: ['src/**/*.js']
            },
            test: {
                options: {
                    jshintrc: '.jshintrc'
                },
                src: ['test/**/*.js']
            }
        },
        uglify: {
            options: {
                banner: '<%= banner %>'
            },
            dist: {
                src: '<%= browserify.dist.dest %>',
                dest: 'dist/vjs-html5-dash.min.js'
            },
            dev: {
                src: '<%= browserify.dev.dest %>',
                dest: 'dist/vjs-html5-dash-debug.min.js'
            }
        },
        karma: {
          unit: {
            configFile: 'karma.conf.js'
          }
        },
        watch: {
          files: ['src/**/*.js', 'test/**/*.js', 'test/index.html'],
          tasks: ['browserify:dev', 'browserify:test', 'jshint']
        },
        connect: {
            server: {
                options: {
                    port: '8888',
                    keepalive: true
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-karma');

    grunt.registerTask('default', ['clean', 'jshint', 'browserify:dist', 'uglify:dist']);
    grunt.registerTask('dev', ['clean', 'jshint', 'browserify:dev', 'karma', 'watch']);
    grunt.registerTask('all', ['clean', 'jshint', 'browserify:dist', 'browserify:dev', 'uglify:dist', 'uglify:dev']);
    grunt.registerTask('test', ['karma']);
};
