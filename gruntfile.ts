module.exports = function (grunt: any) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        clean: {
            default: {
                dot: true,
                src: ["production/**/*"]
            },
        },
        ts: {
            default: {
                tsconfig: true
            },
        },
        copy: {
            default: {
                files: [
                    {
                        nonull: true,
                        src: 'src/.env.example',
                        dest: 'production/.env.example',
                    }, {
                        nonull: true,
                        src: 'package.json',
                        dest: 'production/package.json',
                    }, {
                        nonull: true,
                        src: 'package-lock.json',
                        dest: 'production/package-lock.json',
                    }
                ]
            },
            envToProd: {
                files: [
                    {
                        nonull: true,
                        src: 'src/.env',
                        dest: 'production/.env',
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
                        dot: true,
                        src: '**/*',
                        expand: true,
                        cwd: 'production/'
                    }
                ]
            }
        }
    });
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks("grunt-contrib-compress");
    grunt.registerTask('compile_time', 'Prints the compile time to a file', function () {
        var timestamp = new Date().toUTCString();
        console.log("Compilation time is at " + timestamp);
        grunt.file.write(__dirname + '/production/.compile_time', timestamp);
    });
    grunt.registerTask('default', ['clean', 'ts', 'copy:default', 'compile_time', 'compress', 'copy:envToProd']);
};