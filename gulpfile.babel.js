import gulp from 'gulp';
import browserSync from 'browser-sync';
import plumber from 'gulp-plumber';
import gulpif from 'gulp-if';

import pug from 'gulp-pug';
import stylus from 'gulp-stylus';
import prefixer from 'gulp-autoprefixer';
import csso from 'gulp-csso';
import uglify from 'gulp-uglify';

import image from 'gulp-image';
import svgSprite from 'gulp-svg-sprite';
import svgmin from 'gulp-svgmin';
import cheerio from 'gulp-cheerio';
import replace from 'gulp-replace';
import cache from 'gulp-cache';

import rigger from 'gulp-rigger';
import urlAdjuster from 'gulp-css-url-adjuster';

import imageMin from 'gulp-imagemin';
import jpegRecompress from 'imagemin-jpeg-recompress'
import del from 'del'

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
    default: {
        src: {
            html: 'src/default/*.pug',
            sprite: 'src/default/sprite/**/*.svg',
            js: ['src/default/js/*.js', '!src/default/js/vendors.js'],
            jsVendors: 'src/default/js/vendors.js',
            images: 'src/default/images/*',
            fonts: 'src/default/fonts/*'
        },
        watch: {
            html: 'src/default/**/*.pug',
            sprite: 'src/default/sprite/**/*.svg',
            style: 'src/default/style/**/*.styl',
            js: ['src/default/js/*.js', '!src/default/js/vendors.js'],
            jsVendors: ['src/default/js/vendors/**/*.js', 'src/default/js/vendors.js'],
            images: 'src/default/images/*',
            fonts: 'src/default/fonts/*'
        }
    },
    main: {
        src: {
            html: 'src/main/*.pug',
            style: 'src/main/style/**/main.styl',
            sprite: 'src/main/sprite/**/*.svg',
            styles: 'src/main/style/',
            js: 'src/main/js/*.js'
        },
        watch: {
            html: 'src/main/**/*.pug',
            sprite: 'src/main/sprite/**/*.svg',
            style: 'src/main/style/**/*.styl',
            js: 'src/main/js/*.js'
        }
    },
    clean: './build'
};

const pathImageMin = {
    build: 'imageMin/build/',
    source: 'imageMin/source/'
}

const loadToWeb = {
    default: {
        images: false,
        js: false,
        fonts: false
    },
    main: {
        css: false,
        sprite: false,
        js: false
    }
};

// Default
gulp.task('default:html', () => {
    return gulp.src(path.default.src.html)
        .pipe(plumber())
        .pipe(pug())
        .pipe(gulp.dest(path.build.html));
});
gulp.task('default:html-watch', (done) => {
    return gulp.series(
        'default:html',
        'main:html',
        _reload
    )(done);
});
gulp.task('default:jsVendors', () => {
    return gulp.src(path.default.src.jsVendors)
        .pipe(rigger())
        .pipe(uglify())
        .pipe(gulp.dest(path.build.js))
        .pipe(gulpif(loadToWeb.default.js, gulp.dest(path.web.js)))
        .pipe(reload({stream: true}));
});
gulp.task('default:images', () => {
    return gulp.src(path.default.src.images)
        .pipe(gulp.dest(path.build.images))
        .pipe(gulpif(loadToWeb.default.images, gulp.dest(path.web.images)))
        .pipe(reload({stream: true}));
});

gulp.task('default:images-all', () => {
    return gulp.src(pathImageMin.source + '**/*.*')
        .pipe(image({
            pngquant: true,
            optipng: true,
            zopflipng: false,
            jpegRecompress: false,
            mozjpeg: false,
            guetzli: false,
            gifsicle: true,
            svgo: true,
            concurrent: 10
        }))
        .pipe(gulp.dest(pathImageMin.build))
});
gulp.task('default:images-jpg', () => {
    return gulp.src(pathImageMin.source + '**/*.jpg')
        .pipe(imageMin([
            jpegRecompress({
                min: 75,
                max: 95,
                quality: 'high'
            })
        ]))
        .pipe(gulp.dest(pathImageMin.build))
});
gulp.task('image-min',
    gulp.series(
        () => {
            return del(pathImageMin.build, {dryRun: true}).then(paths => {
                if (paths) {
                    del.sync(pathImageMin.build)
                }
            })
        },
        'default:images-all',
        'default:images-jpg'
    )
);

gulp.task('default:fonts', () => {
    return gulp.src(path.default.src.fonts)
        .pipe(gulpif(loadToWeb.default.fonts, gulp.dest(path.web.fonts)))
        .pipe(gulp.dest(path.build.fonts));
});
gulp.task('default:build',
    gulp.parallel(
        'default:html',
        'default:jsVendors',
        'default:images',
        'default:fonts',
    )
);
gulp.task('default:watch', () => {
    gulp.watch(path.default.watch.jsVendors, gulp.series('default:jsVendors'));

    // use if you have little images
    gulp.watch([path.default.watch.images], gulp.series('default:images'));

    gulp.watch([path.default.watch.fonts], gulp.series('default:fonts'));
    gulp.watch([path.default.watch.html], gulp.parallel('default:html-watch'));
});

// Main site
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
gulp.task('main:spriteSvg', () => {
    return gulp.src([path.default.src.sprite, path.main.src.sprite])
        .pipe(svgmin())
        .pipe(cheerio({
            parserOptions: {xmlMode: true}
        }))
        .pipe(replace('&gt;', '>'))
        .pipe(svgSprite({
                mode: {
                    symbol: {
                        dest: "",
                        sprite: "sprite.svg",
                        render: {
                            styl: {
                                dest: "sprite.styl",
                                template: "src/handlebars/sprite.styl"
                            }
                        }
                    }
                },
                shape: {
                    id: {
                        generator: "icon-%s"
                    }
                },
                svg: {
                    xmlDeclaration: false,
                    rootAttributes: {
                        width: 0,
                        height: 0,
                        style: "position:absolute;"
                    },
                    namespaceClassnames: false
                }
            }
        ))
        .pipe(gulp.dest(path.main.src.styles));
});
gulp.task('main:style', () => {
    return gulp.src(path.main.src.style)
        .pipe(plumber())
        .pipe(stylus({
            'include css': true
        }))
        .pipe(prefixer({browsers: ['last 3 versions']}))
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
gulp.task('main:build',
    gulp.series(
        'main:spriteSvg',
        'main:html',
        'main:style',
        'main:js'
    )
);
gulp.task('main:sprite',
    gulp.series(
        'main:spriteSvg',
        'main:html'
    )
);
gulp.task('main:watch', () => {
    gulp.watch([path.main.watch.sprite, path.default.watch.sprite], gulp.series('main:sprite'));
    gulp.watch([path.main.watch.style, path.default.watch.style], gulp.series('main:style'));
    gulp.watch([path.main.watch.js], gulp.series('main:js'));
    gulp.watch([path.main.watch.html], gulp.series('main:html-watch'));
});

gulp.task('build',
    gulp.series(
        'default:build',
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
        'default:watch',
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