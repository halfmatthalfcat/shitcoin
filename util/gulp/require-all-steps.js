/**
 * Require all steps and make available in gulpfile.js
 */

const fs =    require("fs");
const path =  require("path");

/**
 * Iterate over all the "-step" files in util/gulp/ directory and require them
 * @param {Gulp} gulp - The project gulp instance
 * @param {string} rootDir - The project root path
 */
module.exports = (gulp, rootDir) => {

  const gulpDir = path.join(rootDir, "/util/gulp");

  /**
   * Iterate over all of the files in the gulp directory
   * and if they end in "-step", require them
   */
  fs.readdirSync(gulpDir)
    .forEach((file) => {
      if (/.+-step\.js/.test(file)) {
        require(path.join(gulpDir, `/${file}`))(gulp, rootDir);
      }
    });

};
