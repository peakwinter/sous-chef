import ExtractTextPlugin from 'extract-text-webpack-plugin';
import named from 'vinyl-named';
import webpack from 'webpack';
import webpackStream from 'webpack-stream';
import nodeExternals from 'webpack-node-externals';

// Load Plugins
// ==========================================
const gulp = require('gulp');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const bytediff = require('gulp-bytediff');
const minifycss = require('gulp-clean-css');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin');
const cache = require('gulp-cache');
const debug = require('gulp-debug');
const validate = require('gulp-jsvalidate');

// Paths
// ==========================================
// - Source path folders
const SRC_SCSS = './src/frontend/scss';
const SRC_JS = './src/frontend/js';
const SRC_IMG = './src/frontend/images';

// - Source paths
// Add any additional vendor or site files added to the appropriate property below.
const sources = {

  js: {
    scripts: {
      vendor: [
        'jquery-tablesort/jquery.tablesort',
        'jquery.formset/src/jquery.formset',
        'leaflet-routing-machine/dist/leaflet-routing-machine',
        'leaflet-control-geocoder/dist/Control.Geocoder',
        'leaflet.awesome-markers/dist/leaflet.awesome-markers',
        'leaflet.icon.glyph/Leaflet.Icon.Glyph',
        'sortablejs/Sortable',
        'jquery-ui-multi-date-picker/dist/jquery-ui.multidatespicker',
      ],
      site: [
        `${SRC_JS}/App.js`,
      ]
    },
  },

  css: {
    vendor: [
      'semantic-ui-calendar/dist/calendar.css',
      'leaflet-routing-machine/dist/leaflet-routing-machine.css',
      'leaflet-control-geocoder/dist/Control.Geocoder.css',
      'leaflet.awesome-markers/dist/leaflet.awesome-markers.css',
    ],
    site: [
      `${SRC_SCSS}/main.scss`,
    ]
  },

  img: {
    vendor: [
      'leaflet-routing-machine/dist/*.{png,svg}',
      'leaflet-control-geocoder/dist/images/*',
      'leaflet.awesome-markers/dist/images/*',
      'leaflet.icon.glyph/*.{png,svg}',
    ],
    site: [
      `${SRC_IMG}/**/*`,
    ]
  }
};

// - Destination path folders
const destinations = {
  base: './src/sous_chef/static',
  css: './src/sous_chef/static/css',
  js: './src/sous_chef/static/js',
  img: './src/sous_chef/static/images',
};


const webpackConfig = {
  entry: {
    app: [`${SRC_JS}/App.js`, `${SRC_SCSS}/App.scss`],
    vendor: sources.js.scripts.vendor.concat([`${SRC_SCSS}/Vendor.scss`])
  },
  output: {
    filename: 'js/[name].js',
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.webpack.js', '.web.js', '.js', '.jsx', '.json', 'scss'],
    alias: {
      'jquery-ui-dist': 'jquery-ui-dist/jquery-ui',
    },
  },
  module: {
    rules: [
      {test: /\.jsx?$/, exclude: /node_modules/, use: 'babel-loader'},
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          use: ['css-loader', 'sass-loader'],
          fallback: 'style-loader',
          publicPath: '../',
        }),
      },
      {test: /\.txt$/, use: 'raw-loader'},
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)([?]?.*)$/,
        use: 'url-loader?limit=10000',
      },
      {test: /\.(eot|ttf|wav|mp3|otf)([?]?.*)$/, use: 'file-loader'},
    ],
  },
  plugins: [
    new ExtractTextPlugin({filename: 'css/[name].css', disable: false}),
    ...([
      new webpack.LoaderOptionsPlugin({minimize: true}),
      new webpack.optimize.UglifyJsPlugin({compress: {warnings: false}}),
      new webpack.optimize.CommonsChunkPlugin({name: 'vendor', filename: 'vendor.js'}),
    ]),
  ],
};

gulp.task('build-webpack-assets', () =>
  gulp.src([`${SRC_JS}/App.js`, `${SRC_SCSS}/App.scss`, `${SRC_SCSS}/Vendor.scss`])
    .pipe(named())
    .pipe(webpackStream(webpackConfig, webpack))
    .pipe(gulp.dest(destinations.base)),
);


// Tasks
// ==========================================

gulp.task('styles', () =>
  gulp.src([].concat(sources.css.vendor).concat(sources.css.site))
    .pipe(sass({ style: 'expanded', errLogToConsole: true }))
    .pipe(autoprefixer({
      browsers: ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'],
      cascade: false
    }))
    .pipe(concat('main.css'))
    .pipe(bytediff.start())
    .pipe(gulp.dest('/tmp/css'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(minifycss())
    .pipe(bytediff.stop(bytediffFormatter))
    .pipe(gulp.dest(destinations.css))
);

gulp.task('scripts', () =>
  gulp.src([].concat(sources.js.scripts.vendor).concat(sources.js.scripts.site))
    .pipe(concat('sous-chef.js'))
    .pipe(babel({presets: ['babel-preset-es2015'].map(require.resolve)}))
    .pipe(gulp.dest(destinations.js))
    .pipe(sourcemaps.init())
    .pipe(bytediff.start())
    .pipe(uglify())
    .pipe(bytediff.stop(bytediffFormatter))
    .pipe(rename({ suffix: '.min' }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(destinations.js))
);

gulp.task('images', () =>
  gulp.src([].concat(sources.img.vendor).concat(sources.img.site))
    .pipe(cache(imagemin({
      optimizationLevel: 3,
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest(destinations.img))
);

gulp.task('default', () => {
  gulp.start('styles', 'scripts', 'images');
});

gulp.task('watch', ['default'], () => {
  gulp.watch(`${SRC_SCSS}/**/*.scss`, ['styles']);
  gulp.watch(`${SRC_JS}/**/*.js`, ['scripts']);
  gulp.watch(`${SRC_IMG}/**/*`, ['images']);
});

gulp.task('validate', () =>
  gulp.src([].concat(sources.js.scripts.site))
  .pipe(debug())
  .pipe(validate())
  .on('error', onError)
);


// Log errors on JS validation problems.
function onError(error) {
 console.log(error.message);

 if (error.plugin === 'gulp-jsvalidate') {
   console.log('In file: ' + error.fileName);
 }

 process.exit(1);
};

// Tell us how much our files have been compressed after minification.
function bytediffFormatter(data) {
  return `${data.fileName} went from ${(data.startSize / 1000).toFixed(2)} ` +
  `kB to ${(data.endSize / 1000).toFixed(2)} kB and is ` +
  `${formatPercent(1 - data.percent, 2)}% ` +
  `${(data.savings > 0) ? 'smaller' : 'larger'}.`;
};

function formatPercent(num, precision) {
  return (num * 100).toFixed(precision);
};
