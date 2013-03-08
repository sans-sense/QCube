module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta : {
            src : 'src/**/*.js',
            specs : 'spec/**/*.js'
        },
        watch: {
            test : {
                files: ['<%= meta.src %>','<%= meta.specs %>'],
                tasks: 'test'
            }
        },
        jshint: {
            all: [
                'GruntFile.js', 
                '<%= meta.src %>',
                '<%= meta.specs %>'
            ]
        },
        jasmine : {
            src : '<%= meta.src %>',
            options : {
                specs : '<%= meta.specs %>'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: '<%= meta.src %>',
                dest: 'build/qcube.min.js'
            }
        }
    });

    // Register tasks.
    ['jshint', 'uglify', 'jasmine', 'watch' ].forEach(function(contrib_module_name) {
        grunt.loadNpmTasks('grunt-contrib-' + contrib_module_name);
    })
    
    grunt.registerTask('complete', ['jshint', 'uglify']);
    grunt.registerTask('test', ['jshint', 'jasmine']);

    // Default task.
    grunt.registerTask('default', 'jasmine');
};