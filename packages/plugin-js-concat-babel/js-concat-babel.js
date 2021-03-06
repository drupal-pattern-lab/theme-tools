'use strict';

const gulp = require('gulp');
const eslint = require('gulp-eslint');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const babel = require('gulp-babel');
const cached = require('gulp-cached');
const gulpif = require('gulp-if');
const del = require('del');
const path = require('path');
const core = require('@theme-tools/core');
const defaultConfig = require('./config.default');

module.exports = (userConfig) => {
  const config = core.utils.merge({}, defaultConfig, userConfig);
  const tasks = {};

  function validate() {
    return gulp.src([].concat(config.src, config.eslint.extraSrc))
      .pipe(cached('validate:js'))
      .pipe(eslint())
      .pipe(eslint.format());
  }

  function fix() {
    return gulp.src([].concat(config.src, config.eslint.extraSrc))
    .pipe(eslint({
      fix: true,
    }))
    .pipe(gulp.dest(file => file.base));
  }
  fix.description = 'Fix the ESlint errors that can be fixed.';
  fix.displayName = 'js:fix';
  if (config.eslint.enabled) tasks.fix = fix;

  function validateJs() {
    return validate()
      .pipe(eslint.failAfterError());
  }
  validateJs.description = 'Lint JS.';
  validateJs.displayName = 'js:validate';
  if (config.eslint.enabled) tasks.validate = validateJs;

  function compileJs(done) {
    gulp.src(config.src)
      .pipe(sourcemaps.init())
      .pipe(gulpif(config.babel, babel(config.babelConfig)))
      .pipe(concat(config.destName))
      .pipe(gulpif(config.uglify, uglify()))
      .pipe(sourcemaps.write(config.sourceMapEmbed ? null : './'))
      .pipe(gulp.dest(config.dest))
      .on('end', () => {
        core.events.emit('reload', path.join(config.dest, config.destName));
        done();
      });
  }
  compileJs.description = 'Transpile JS using Babel, concat and uglify.';
  compileJs.displayName = 'js:compile';
  tasks.compile = compileJs;

  function watch() {
    const watchTasks = [compileJs];
    if (config.eslint.enabled) watchTasks.push(validate);
    gulp.watch([].concat(config.src, config.eslint.extraSrc), gulp.parallel(watchTasks));
  }
  watch.description = 'Watch JS';
  watch.displayName = 'js:watch';
  tasks.watch = watch;

  function cleanJs(done) {
    del([
      path.join(config.dest, '*.{js,js.map}'),
    ], { force: true }).then(() => done());
  }
  cleanJs.description = 'Clean JS files';
  cleanJs.displayName = 'js:clean';
  tasks.clean = cleanJs;

  return tasks;
};
