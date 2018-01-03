/**
 * Contains the project gulp compilation steps
 */

const path =    require("path");
const ts =      require("gulp-typescript");

/**
 * Setup the compilation tasks using our gulp instance
 * @param {Gulp} gulp - The project gulp instance
 * @param {string} rootDir - The project root path
 */
module.exports = (gulp, rootDir) => {

  const tsProject = ts.createProject(path.join(rootDir, "/tsconfig.json"));

  gulp.task("compile", [
    "ts-compile"
  ]);

  gulp.task("ts-compile", [ "lint" ], () => {

    return gulp.src(path.join(rootDir, "/{src,test}/**/*.ts"))
      .pipe(tsProject())
      .pipe(gulp.dest(path.join(rootDir, "/dist")));

  });

};
