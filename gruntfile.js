module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        ts: {
            default: {
                tsconfig: true
            },
        },
        clean: {
            default: {
                dot: true,
                src: ["build/**/*"]
            },
        },
        copy: {
            default: {
                files: [
                    {
                        nonull: true,
                        src: 'src/.env.example',
                        dest: 'build/.env.example',
                    },
                    {
                        nonull: true,
                        src: 'package.json',
                        dest: 'src/package.json',
                    }, {
                        nonull: true,
                        src: 'package.json',
                        dest: 'build/package.json',
                    }
                ]
            },
        },
        compress: {
            default: {
                options: {
                    archive: 'dist/<%= pkg.version %>.zip',
                    mode: 'zip'
                },
                files: [
                    {
                        src: '**/*',
                        expand: true,
                        cwd: 'build/'
                    }
                ]
            }
        }
    });
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks("grunt-contrib-compress");
    grunt.registerTask("default", ["clean", "ts", "copy", "compress"]);
};