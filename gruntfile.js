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
                src: ["build/**/*", "dist/**/*"]
            },
        },
        copy: {
            default: {
                nonull: true,
                src: 'src/.env.example',
                dest: 'build/.env.example',
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
    grunt.registerTask("default", ["clean:default", "ts:default", "copy:default", "compress:default"]);
};