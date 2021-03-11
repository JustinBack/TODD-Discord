module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        clean: {
            default: {
                dot: true,
                src: ["build/**/*"]
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
                        dest: 'build/.env.example',
                    }, {
                        nonull: true,
                        src: 'package.json',
                        dest: 'build/package.json',
                    }, {
                        nonull: true,
                        src: 'package-lock.json',
                        dest: 'build/package-lock.json',
                    }
                ]
            },
            envToProd: {
                files: [
                    {
                        nonull: true,
                        src: 'src/.env',
                        dest: 'build/.env',
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
    grunt.registerTask("default", ["clean", "ts", "copy:default", "compress", "copy:envToProd"]);
};