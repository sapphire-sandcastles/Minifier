const {series, parallel, src, dest, watch} = require('gulp');
const gulp = require('gulp');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const notify = require('gulp-notify');
const rename = require('gulp-rename');
const cleanCSS = require('gulp-clean-css');
const plumber = require('gulp-plumber');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const browserify = require('browserify');
const through = require('through2');
const globby = require('globby');
const log = require('gulplog');

const distURL = 'dist/';
const srcURL = 'src/';

let javascript = () => {
  var bundledStream = through();

  bundledStream
    .pipe(source(`bundle.min.js`))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps:true }))
      .pipe(uglify())
      .on('error', log.error)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(`${distURL}js/`));

  globby([`${srcURL}js/Global.js`]).then((entries) => {
    let target = browserify({
      entries: entries, 
      debug: true, 
      insertGlobals: true
    }).transform("babelify", {
      presets: ["@babel/preset-env"]
    });

    target.bundle().pipe(bundledStream);
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

  return src(`${srcURL}scss/styles.scss`, { allowEmpty : true })
    .pipe(concat('bundle.min.scss'))
    .pipe(sourcemaps.init())
    .pipe(plumber({ errorHandler: onError }))
    .pipe(sass())
    .pipe(sourcemaps.write())
    .pipe(cleanCSS())
    .pipe(rename('bundle.min.css'))
    .pipe(dest(`${distURL}scss`));
}

function fonts() {
  return src('node_modules/@fortawesome/fontawesome-pro/webfonts/*')
         .pipe(dest(`${distURL}scss/webfonts`));
}

const build = parallel(styles, javascript);
const build_fonts = series(fonts);

exports.default = build;
exports.buildFonts = build_fonts;