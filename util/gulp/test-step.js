/**
 * Gulp unit testing step that runs Karma/PhantomJS
 */

const path = require("path");
const jest = require("gulp-jest-cli").default;

/**
 * Setup the unit test task using our gulp instance
 * @param {Gulp} gulp - The project gulp instance
 * @param {string} rootDir - The project root path
 */
module.exports = (gulp, rootDir) => {

  gulp.task("unit", [ "lint" ], function() {

    return gulp
      .src(path.join(rootDir, "/src"))
      .pipe(jest({
        config: {
          testEnvironment: "node",
          transform: {
            "^.+\\.ts$": path.join(rootDir, "/node_modules/ts-jest/preprocessor.js")
          },
          testMatch: [
            "**/*.spec.ts"
          ],
          moduleFileExtensions: [
            "ts",
            "js",
            "json"
          ],
          coverageDirectory: path.join(rootDir, "/coverage"),
          collectCoverageFrom: [
            "src/**/*.ts",
            "!src/**/*.d.ts"
          ],
          coverageReporters: [
            "html",
            "text-summary"
          ],
          testRunner: path.join(rootDir, "/node_modules/jest-jasmine2/build/index.js"),
          mapCoverage: true,

        },
        coverage: true,
        noCache: true,
        verbose: true
      }));

  });

};
