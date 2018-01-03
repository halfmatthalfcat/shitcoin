/**
 * Gulpfile for the Vaudeville project
 */

const gulp =            require("gulp");
const requireAllSteps = require("./util/gulp/require-all-steps");

/**
 * Require all steps defined in util/gulp/*
 */
requireAllSteps(gulp, __dirname);

gulp.task("default", [
  "build"
]);

gulp.task("build", [
  "lint",
  "compile"
]);
