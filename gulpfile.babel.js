import gulp from 'gulp';
import browserSync from 'browser-sync';
import plumber from 'gulp-plumber';
import gulpif from 'gulp-if';

import pug from 'gulp-pug';
import stylus from 'gulp-stylus';
import prefixer from 'gulp-autoprefixer';
import csso from 'gulp-csso';

import cheerio from 'gulp-cheerio';
import replace from 'gulp-replace';

import urlAdjuster from 'gulp-css-url-adjuster';

let buildVersion = (new Date()).getTime();

//reloads the browser
let reload = browserSync.reload;
function _reload(done){
    browserSync.reload();
    done();
}

const path = {
    build: {
        html: 'build/',
        js: 'build/js/',
        css: 'build/css/',
        images: 'build/images/',
        fonts: 'build/fonts/'
    },
    web: {
        js: './',
        css: './',
        images: './',
        fonts: './'
    },
    main: {
        src: {
            html: 'src/main/*.pug',
            style: 'src/main/style/**/main.styl',
            styles: 'src/main/style/',
            js: 'src/main/js/*.js',
            images: 'src/main/images/*'
        },
        watch: {
            html: 'src/main/**/*.pug',
            style: 'src/main/style/**/*.styl',
            js: 'src/main/js/*.js',
            images: 'src/main/images/*'
        }
    },
    clean: './build'
};

const pathImageMin = {
    build: 'imageMin/build/',
    source: 'imageMin/source/'
}

const loadToWeb = {
    main: {
        css: false,
        sprite: false,
        js: false,
        images: false
    }
};

// Main
gulp.task('main:html', () => {
    return gulp.src(path.main.src.html)
        .pipe(plumber())
        .pipe(pug({pretty: false}))
        .pipe(gulp.dest(path.build.html));
});
gulp.task('main:html-watch', (done) => {
    return gulp.series(
        'main:html',
        _reload
    )(done);
});
gulp.task('main:style', () => {
    return gulp.src(path.main.src.style)
        .pipe(plumber())
        .pipe(stylus({
            'include css': true
        }))
        .pipe(prefixer())
        .pipe(urlAdjuster({
            append: '?v=' + buildVersion
        }))
        .pipe(csso({
            restructure: false,
            // sourceMap: true,
            // debug: true
        }))
        .pipe(gulp.dest(path.build.css))
        .pipe(gulpif(loadToWeb.main.css, gulp.dest(path.web.css)))
        .pipe(reload({stream: true}));
});
gulp.task('main:js', () => {
    return gulp.src(path.main.src.js)
        .pipe(gulp.dest(path.build.js))
        .pipe(gulpif(loadToWeb.main.js, gulp.dest(path.web.js)))
        .pipe(reload({stream: true}));
});
gulp.task('main:images', () => {
    return gulp.src(path.main.src.images)
        .pipe(gulp.dest(path.build.images))
        .pipe(gulpif(loadToWeb.main.images, gulp.dest(path.web.images)))
        .pipe(reload({stream: true}));
});
gulp.task('main:build',
    gulp.series(
        'main:html',
        'main:style',
        'main:js',
        'main:images',
    )
);
gulp.task('main:sprite',
    gulp.series(
        'main:html'
    )
);
gulp.task('main:watch', () => {
    gulp.watch([path.main.watch.js], gulp.series('main:js'));
    gulp.watch([path.main.watch.html], gulp.series('main:html-watch'));
    gulp.watch([path.main.watch.style], gulp.series('main:style'));
    // use if you have little images
    gulp.watch([path.main.watch.images], gulp.series('main:images'));
});

gulp.task('build',
    gulp.series(
        'main:build'
    )
);

// Server config
let config = {
    server: {
        baseDir: "./build"
    },
    open: false,
    tunnel: false,
    host: 'localhost',
    port: 9002,
    logPrefix: "frontend_dev",
    notify: false,
    reloadDelay: 100,
};

// Run server listen
gulp.task('webserver', () => {
    browserSync(config);
});

gulp.task('watch',
    gulp.parallel(
        'main:watch'
    )
);

gulp.task('default',
    gulp.parallel(
        gulp.series(
            'build',
            'webserver',
        ),
        'watch',
    )
);