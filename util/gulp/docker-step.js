/**
 * Build dockerfile and tag
 */

const dkode =     require('dockerode');
const docker =    require('dockernode');
const fs =        require('fs');
const tar =       require('tar-fs');
const path =      require('path');
const exec =      require('child_process').exec;

module.exports = (gulp, rootDir) => {

  const dkr = new dkode();

  const repo = "245802995440.dkr.ecr.us-east-1.amazonaws.com/newon";

  const getPkgJson = () => {
    return JSON.parse(
      fs.readFileSync(
        path.join(rootDir, '/package.json'),
        'utf8'
      )
    );
  };

  const getCurrentVersion = () => {
    return getPkgJson().version;
  }

  const dockerLogin = () => {
    return new Promise((resolve, reject) => {
      exec('aws ecr get-login --no-include-email', (err, stdout) => {
        exec(stdout, (err, stdout) => {
          console.log(stdout);
          err ? reject(err) : resolve();
        });
      });
    });
  };

  const buildImage = (cb) => {
    // Tar up the directory contents to feed to docker
    const contents = tar.pack(
      rootDir, {
        entries: [
          'src',
          'util',
          'config.json',
          'D.ockerfile',
          'gulpfile.js',
          'package.json',
          'secrets.json',
          'tsconfig.json',
          'tslint.json'
        ]
      }
    );

    return dkr
      .buildImage(
        contents,
        { t: `newon:${getCurrentVersion()}`, dockerfile: 'D.ockerfile' },
        (err, stream) => {
          if (err) { console.log(err); cb(); }
          else {
            stream
              .pipe(process.stdout, {
                end: true
              });

            stream.on('end', cb);
          }
        }
      );
  };

  const tagImage = (cb) => {
    docker(`tag newon:${getCurrentVersion()} ${repo}:${getCurrentVersion()}`, () => {
      cb();
    });
  };

  const pushImage = (cb) => {
    docker(`push ${repo}:${getCurrentVersion()}`, () => {
      cb();
    });
  };

  gulp.task('docker-login', dockerLogin);
  gulp.task('build-image', buildImage);
  gulp.task('tag-image', tagImage);
  gulp.task('push-image', pushImage);

  /* Ensure we're logged into ECR */
  gulp.task('docker-login-patch', [ 'bump-patch' ], dockerLogin);
  gulp.task('docker-login-minor', [ 'bump-minor' ], dockerLogin);
  gulp.task('docker-login-major', [ 'bump-major' ], dockerLogin);

  /* Build the new Docker image */
  gulp.task('build-image-patch', [ 'docker-login-patch' ], buildImage);
  gulp.task('build-image-minor', [ 'docker-login-minor' ], buildImage);
  gulp.task('build-image-major', [ 'docker-login-major' ], buildImage);

  /* Tag the image */
  gulp.task('tag-image-patch', [ 'build-image-patch' ], tagImage);
  gulp.task('tag-image-minor', [ 'build-image-minor' ], tagImage);
  gulp.task('tag-image-major', [ 'build-image-major' ], tagImage);

  /* Push the image */
  gulp.task('push-image-patch', [ 'tag-image-patch' ], pushImage);
  gulp.task('push-image-minor', [ 'tag-image-minor' ], pushImage);
  gulp.task('push-image-major', [ 'tag-image-major' ], pushImage);

};
