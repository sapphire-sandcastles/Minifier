const {series, parallel, src, dest, watch} = require('gulp');
const gulp = require('gulp');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const notify = require('gulp-notify');
const rename = require('gulp-rename');
const cleanCSS = require('gulp-clean-css');
const browserSync = require('browser-sync');
const plumber = require('gulp-plumber');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const browserify = require('browserify');
const through = require('through2');
const globby = require('globby');
const log = require('gulplog');

const server = browserSync.create();

const projectURL = 'http://bedrock.test';
const themeURL = 'web/app/themes/frogspark/';

let javascript = () => {
  var bundledStream = through();

  bundledStream
    .pipe(source(`bundle.min.js`))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps:true }))
      .pipe(uglify())
      .on('error', log.error)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(`${themeURL}js/dist/`))
    .pipe(server.stream());

  globby([`${themeURL}js/src/Global.js`]).then((entries) => {
    let b = browserify({
      entries: entries, 
      debug: true, 
      insertGlobals: true
    }).transform("babelify", {
      presets: ["@babel/preset-env"]
    });

    b.bundle().pipe(bundledStream);
  }).catch((err) => {
    bundledStream.emit('error', err);
  });

  return bundledStream;
}

function styles() {
  const onError = (err) => {
    notify({
      title: 'Gulp Task Error',
      message: 'Gulp Task errored, check console',
    }).write(err);
    console.log(err.toString());
  };

  server.notify('Compiling SCSS');

  return src(`${themeURL}scss/src/styles.scss`)
    .pipe(concat('bundle.min.scss'))
    .pipe(sourcemaps.init())
    .pipe(plumber({ errorHandler: onError }))
    .pipe(sass())
    .pipe(sourcemaps.write())
    .pipe(cleanCSS())
    .pipe(rename('bundle.min.css'))
    .pipe(dest(`${themeURL}scss/dist`))
    .pipe(server.stream());
}

function fonts() {
  return src('node_modules/@fortawesome/fontawesome-pro/webfonts/*')
         .pipe(dest(`${themeURL}scss/webfonts`));
}

function browsersync() {
  server.init({
    proxy: projectURL,
  });

  watch(`${themeURL}scss/src/**/*.scss`, styles);
  watch(`${themeURL}js/src/*.js`, javascript);
  watch(`${themeURL}**/*.php`).on('change', server.reload);
}

const development = series(fonts, styles, javascript, browsersync);
const production = parallel(fonts, styles, javascript);

exports.production = production;
exports.default = development;