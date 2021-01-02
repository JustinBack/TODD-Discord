module.exports = function (grunt) {
    grunt.initConfig({
        ts: {
            default: {
                tsconfig: true
            },
        },
        clean: {
            default: {
                dot: true,
                src: "build/**/*"
            },
        },
        copy: {
            default: {
                nonull: true,
                src: 'src/.env.example',
                dest: 'build/.env.example',
            },
        },
    });
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask("default", ["clean:default", "ts:default", "copy:default"]);
};