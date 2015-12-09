'use strict';

const Router = require('../');
const Koa = require('koa');
const request = require('supertest');
const should = require('should');

const methods = [
    'options',
    'head',
    'get',
    'post',
    'put',
    'patch',
    'delete'
];

describe('Koa-66', () => {
    describe('core', () => {
        it('middleware must be present', done => {
            const router = new Router();
            try {
                router.get('/');
                done(Error());
            } catch (e) {
                e.message.should.equal('middleware is required');
                done();
            }
        });

        it('middleware must be a function', done => {
            const router = new Router();
            try {
                router.get('/', 42);
                done(Error());
            } catch (e) {
                e.message.should.equal('middleware must be a function');
                done();
            }
        });

        it('.routes() should be a valid middleware factory', done => {
            const router = new Router();
            router.should.have.property('routes');
            router.routes.should.be.type('function');
            const middleware = router.routes();
            should.exist(middleware);
            middleware.should.be.type('function');
            done();
        });

        it('200 with valid path and body', done => {
            const app = new Koa();
            const router = new Router();

            router.get('/hello', ctx => ctx.body = 'world');

            app.use(router.routes());

            request(app.listen())
                .get('/hello')
                .expect(200)
                .expect('world')
                .end(done);
        });


        it('no routes should return 404', done => {
            const app = new Koa();
            const router = new Router();

            app.use(router.routes());

            request(app.listen())
                .get('/hello')
                .expect(404)
                .end(done);
        });

        it('only use should not be exec', done => {
            const app = new Koa();
            const router = new Router();

            router.use('/', ctx => ctx.body = 'wor');

            app.use(router.routes());

            request(app.listen())
                .get('/')
                .expect(404)
                .end(done);
        });

        it('use without path should be apply to all router object methods', done => {
            const app = new Koa();
            const router = new Router();

            router.use((ctx, next) => {
                ctx.body = 'wor';
                next();
            });

            router.get('/hello', ctx => ctx.body += 'ld');

            app.use(router.routes());

            request(app.listen())
                .get('/hello')
                .expect(200)
                .expect('world')
                .end(done);
        });

        it('should resolve next koa middleware', done => {
            const app = new Koa();
            const router = new Router();

            app.use((ctx, next) => {
                ctx.body = '1';
                return next().then(result => ctx.body += result);
            });

            router.get('/', (ctx, next) => {
                ctx.body += '2';
                return next();
            });

            app.use(router.routes());

            app.use(ctx => {
                ctx.body += '3';
                return Promise.resolve('4');
            });

            request(app.listen())
                .get('/')
                .expect(200)
                .expect('1234')
                .end(done);
        });

        it('it should resolve with value', done => {
            const app = new Koa();
            const router = new Router();

            app.use((ctx, next) => {
                ctx.body = '1';
                return next().then(result => ctx.body += result);
            });

            router.get('/', ctx => {
                ctx.body += '2';
                return Promise.resolve('3');
            });

            app.use(router.routes());

            request(app.listen())
                .get('/')
                .expect(200)
                .expect('123')
                .end(done);
        });
    });

    describe('methods()', () => {
        methods.forEach(m => {
            it(`should work with ${m}`, (done) => {
                const app = new Koa();
                const router = new Router();

                router[m]('/hello', ctx => ctx.body = 'world');

                app.use(router.routes());

                request(app.listen())[m]('/hello')
                    .expect(200)
                    .expect(m === 'head' ? '' : 'world')
                    .end(done);
            });
        });
        methods.forEach(m => {
            it(`should work with ${m} and no path`, (done) => {
                const app = new Koa();
                const router = new Router();

                router[m](ctx => ctx.body = 'world');

                app.use(router.routes());

                request(app.listen())[m]('/')
                    .expect(200)
                    .expect(m === 'head' ? '' : 'world')
                    .end(done);
            });
        });

        it('should work with all', (done) => {
            const app = new Koa();
            const router = new Router();
            let remained = methods.length;

            router.all('/hello', ctx => ctx.body = 'world');

            app.use(router.routes());

            methods.forEach(m => {
                request(app.listen())[m]('/hello')
                    .expect(200)
                    .expect(m === 'head' ? '' : 'world')
                    .end((err) => {
                        if (err) done(err);
                        else if (--remained === 0) done();
                    });
            });
        });

        it('should work with all without path', (done) => {
            const app = new Koa();
            const router = new Router();
            let remained = methods.length;

            router.all(ctx => ctx.body = 'world');

            app.use(router.routes());

            methods.forEach(m => {
                request(app.listen())[m]('/')
                    .expect(200)
                    .expect(m === 'head' ? '' : 'world')
                    .end((err) => {
                        if (err) done(err);
                        else if (--remained === 0) done();
                    });
            });
        });
    });


    describe('mount()', () => {
        it('should throw if no a koa-66 instance', done => {
            const router = new Router();
            (() => router.mount('/', 1)).should.throw('require a Koa66 instance');
            done();
        });

        it('.mount should 200 with correct path', done => {
            const app = new Koa();
            const router = new Router();
            const router2 = new Router();

            router.get('/', ctx => ctx.body = 'world');

            router2.mount('/hello', router);

            app.use(router2.routes());

            request(app.listen())
                .get('/hello')
                .expect(200)
                .expect('world')
                .end(done);
        });

        it('.mount should mount nested routes', done => {
            const app = new Koa();
            const rootRouter = new Router();
            const apiRouter = new Router();
            const router = new Router();

            router.get('/:id', ctx => {
                ctx.body = 'world';
                ctx.route.path.should.be.equal('/api/v1/ticket/:id');
            });

            apiRouter.mount('/ticket', router);
            rootRouter.mount('/api/v1', apiRouter);
            // Must be the last
            app.use(rootRouter.routes());

            request(app.listen())
                .get('/api/v1/ticket/66')
                .expect(200)
                .expect('world')
                .end(done);
        });

        it('.mount should 404 with old path', done => {
            const app = new Koa();
            const router = new Router();
            const router2 = new Router();

            router.get('/', ctx => ctx.body = 'world');

            router2.mount('/hello', router);

            app.use(router2.routes());

            request(app.listen())
                .get('/')
                .expect(404)
                .end(done);
        });

        it('use .mount should be apply only on children', done => {
            const app = new Koa();
            const router = new Router();
            const router2 = new Router();

            router.use((ctx, next) => {
                ctx.body = 'hello';
                next();
            });

            router.get('/', ctx => ctx.body += 'world');

            router2.mount('/hello', router);

            app.use(router2.routes());

            request(app.listen())
                .get('/hello')
                .expect(200)
                .expect('helloworld')
                .end(done);
        });

        it('use .mount should be apply only on children 2', done => {
            const app = new Koa();
            const router = new Router();
            const router2 = new Router();

            router.use((ctx, next) => {
                ctx.body = 'hello';
                next();
            });

            router.get('/', ctx => ctx.body += 'world');
            router2.get('/', ctx => ctx.body += 'pouet');

            router2.mount('/hello', router);

            app.use(router2.routes());

            request(app.listen())
                .get('/')
                .expect(200)
                .expect('undefinedpouet')
                .end(done);
        });
    });

    describe('URL parameters', () => {
        it('url params', done => {
            const app = new Koa();
            const router = new Router();
            const router2 = new Router();

            router.get('/:two/test', ctx => ctx.body = ctx.params);

            router2.mount('/:one', router);

            app.use(router2.routes());

            request(app.listen())
                .get('/one/two/test')
                .expect(200)
                .expect({
                    one: 'one',
                    two: 'two'
                })
                .end(done);
        });
    });

    describe('multiple middleware', () => {
        it('200 with complete body and multiple routes', done => {
            const app = new Koa();
            const router = new Router();

            router.get('/hello', (ctx, next) => {
                ctx.body = 'wor';
                next();
            });

            router.get('/hello', ctx => ctx.body += 'ld');

            app.use(router.routes());

            request(app.listen())
                .get('/hello')
                .expect(200)
                .expect('world')
                .end(done);
        });

        it('multiple routes without next should stop', done => {
            const app = new Koa();
            const router = new Router();

            router.get('/hello', ctx => ctx.body = 'wor');
            router.get('/hello', ctx => ctx.body += 'ld');

            app.use(router.routes());

            request(app.listen())
                .get('/hello')
                .expect(200)
                .expect('wor')
                .end(done);
        });
        it('multiple middleware as array', done => {
            const app = new Koa();
            const router = new Router();

            router.get('/', [(ctx, next) => {
                ctx.body = 'hello';
                next();
            }, ctx => ctx.body += 'world'
            ]);

            app.use(router.routes());

            request(app.listen())
                .get('/')
                .expect(200)
                .expect('helloworld')
                .end(done);
        });

        it('multiple middleware as arguments', done => {
            const app = new Koa();
            const router = new Router();

            router.get('/', (ctx, next) => {
                ctx.body = 'hello';
                next();
            }, ctx => ctx.body += 'world');


            app.use(router.routes());

            request(app.listen())
                .get('/')
                .expect(200)
                .expect('helloworld')
                .end(done);
        });
        it('multiple middleware on use functions', done => {
            const app = new Koa();
            const router = new Router();

            router.use((ctx, next) => {
                ctx.body = 'hello';
                next();
            }, ctx => ctx.body += 'world');

            router.get('/', () => {});

            app.use(router.routes());

            request(app.listen())
                .get('/')
                .expect(200)
                .expect('helloworld')
                .end(done);
        });
    });

    describe('HEAD, OPTIONS, 501 and 405', () => {
        it('should return 501 on not implemented methods', done => {
            const app = new Koa();
            const router = new Router();

            router.get('/', () => {});
            app.use(router.routes());

            request(app.listen())
                .search('/')
                .expect(501)
                .end(done);
        });

        it('throw option, should throw 501 on not implemented methods', done => {
            const app = new Koa();
            const router = new Router();
            router.get('/', () => {});

            app.use(router.routes({
                throw: true
            }));
            app.on('error', err => {
                if (err.name === 'NotImplementedError' && err.statusCode === 501)
                    return done();
                done(Error());
            });

            request(app.listen())
                .search('/')
                .end();
        });

        it('should return 405 on not allowed method', done => {
            const app = new Koa();
            const router = new Router();

            router.use(() => {});
            router.get('/', () => {});
            router.get('/', () => {});
            router.put('/', () => {});
            app.use(router.routes());

            request(app.listen())
                .post('/')
                .expect(405)
                .end((err, res) => {
                    if (err) return done(err);
                    res.header.should.have.property('allow', 'HEAD, GET, PUT');
                    done();
                });
        });

        it('throw option, should throw 405 on not allowed methods with headers', done => {
            const app = new Koa();
            const router = new Router();
            router.get('/', () => {});
            router.get('/', () => {});
            router.put('/', () => {});

            app.use(router.routes({
                throw: true
            }));

            app.on('error', err => {
                if (err.name === 'MethodNotAllowedError' && err.statusCode === 405 && err.headers && err.headers.allow && err.headers.allow === 'HEAD, GET, PUT')
                    return done();
                done(Error());
            });

            request(app.listen())
                .post('/')
                .end();
        });


        it('if no HEAD method registered and have GET should 200', done => {
            const app = new Koa();
            const router = new Router();

            router.get('/', ctx => ctx.body = 'pouet');
            app.use(router.routes());

            request(app.listen())
                .head('/')
                .expect(200)
                .end(done);
        });

        it('options methods has to respond with 204', done => {
            const app = new Koa();
            const router = new Router();

            router.get('/', ctx => ctx.body = 'pouet');
            app.use(router.routes());

            request(app.listen())
                .options('/')
                .expect(204)
                .end(done);
        });
    });

    describe('param()', () => {
        it('should throw if key is not a string', done => {
            const router = new Router();
            (() => router.param()).should.throw('usage: param(string, function)');
            done();
        });
        it('should throw if fn is not a function', done => {
            const router = new Router();
            (() => router.param('')).should.throw('usage: param(string, function)');
            done();
        });

        // param() test taken from koa-router
        it('param should be resolve', done => {
            const app = new Koa();
            const router = new Router();

            router.param('id', (ctx, next, id) => {
                ctx.test = id;
                next();
            });

            router.get('/:id', ctx => ctx.body = ctx.test);
            app.use(router.routes());

            request(app.listen())
                .get('/pouet')
                .expect(200)
                .expect('pouet')
                .end(done);
        });

        it('param should not be resolve', done => {
            const app = new Koa();
            const router = new Router();

            router.param('idc', (ctx, next, id) => {
                ctx.test = id;
                next();
            });

            router.get('/:id', ctx => ctx.body = ctx.test);
            app.use(router.routes());

            request(app.listen())
                .get('/pouet')
                .expect(204)
                .end(done);
        });

        it('runs parent parameter middleware for subrouter', done => {
            const app = new Koa();
            const router = new Router();
            const subrouter = new Router();

            subrouter.get('/:cid', (ctx) => {
                ctx.body = {
                    id: ctx.a,
                    cid: ctx.params.cid
                };
            });

            router
                .param('id', (ctx, next, id) => {
                    ctx.a = id;
                    next();
                })
                .mount('/:id/children', subrouter);

            app.use(router.routes());

            request(app.listen())
                .get('/pouet/children/2')
                .expect(200)
                .expect({
                    id: 'pouet',
                    'cid': '2'
                })
                .end(done);
        });

        it('runs children parameter middleware for subrouter', done => {
            const app = new Koa();
            const router = new Router();
            const subrouter = new Router();

            subrouter
                .param('cid', (ctx, next, cid) => {
                    ctx.b = cid;
                    next();
                })
                .get('/:cid', (ctx) => {
                    ctx.body = {
                        id: ctx.a,
                        cid: ctx.b
                    };
                });

            router
                .param('id', (ctx, next, id) => {
                    ctx.a = id;
                    next();
                })
                .mount('/:id/children', subrouter);

            app.use(router.routes());

            request(app.listen())
                .get('/pouet/children/2')
                .expect(200)
                .expect({
                    id: 'pouet',
                    'cid': '2'
                })
                .end(done);
        });

        it('runs parameter middleware in order of URL appearance', done => {
            const app = new Koa();
            const router = new Router();
            router
                .param('user', (ctx, next) => {
                    ctx.user = {
                        name: 'alex'
                    };
                    if (ctx.ranFirst)
                        ctx.user.ordered = 'parameters';
                    next();
                })
                .param('first', (ctx, next) => {
                    ctx.ranFirst = true;
                    if (ctx.user)
                        ctx.ranFirst = false;
                    next();
                })
                .get('/:first/users/:user', ctx => {
                    ctx.body = ctx.user;
                });
            app.use(router.routes());

            request(app.listen())

            .get('/first/users/3')
                .expect(200)
                .expect({
                    name: 'alex',
                    ordered: 'parameters'
                })
                .end(done);
        });

        it('doesn\'t run parameter middleware if path matched does not have a parameter', done => {
            const app = new Koa();
            const router = new Router();
            router.param('id', (ctx, next, id) => {
                ctx.ranParam = 'true';
                next();
            });

            router.get('/test', ctx => {
                ctx.body = ctx.ranParam || 'false'
            });
            router.get('/:id', ctx => {
                ctx.body = ctx.ranParam || 'false'
            });
            app.use(router.routes());

            request(app.listen())
            .get('/test')
            .expect(200)
            .expect('false')
            .end((err) => {
                if (err) return done(err);
                request(app.listen())
                .get('/not-test')
                .expect(200)
                .expect('true')
                .end(done);
            });
        });
    });

    describe('plugins', () => {
        it('should throw if name is not a string', done => {
            const router = new Router();
            (() => router.plugin()).should.throw('usage: plugin(string, function)');
            done();
        });

        it('should work', done => {
            const app = new Koa();
            const router = new Router();

            router.plugin('test', (ctx, next) => {
                ctx.body = 'hello';
                return next();
            });

            router.get('/', {
                test: true
            }, ctx => {
                ctx.body += 'world';
            });

            app.use(router.routes());

            request(app.listen())
                .get('/')
                .expect(200)
                .expect('helloworld')
                .end(done);
        });

        it('should pass object in options', done => {
            const app = new Koa();
            const router = new Router();

            router.plugin('test', (ctx, next) => {
                ctx.body = ctx.state.plugins.test;
                return next();
            });

            router.get('/', {
                test: [1, 2]
            }, () => {});

            app.use(router.routes());

            request(app.listen())
                .get('/')
                .expect(200)
                .expect([1, 2])
                .end(done);
        });

        it('should stop without next', done => {
            const app = new Koa();
            const router = new Router();

            router.plugin('test', () => {});

            router.get('/', {
                test: true
            }, ctx => {
                ctx.body = 'world';
            });

            app.use(router.routes());

            request(app.listen())
                .get('/')
                .expect(404)
                .end(done);
        });

        it('should work with multiple', done => {
            const app = new Koa();
            const router = new Router();

            router.plugin('test', (ctx, next) => {
                ctx.body = 'hello';
                return next();
            });
            router.plugin('test2', (ctx, next) => {
                ctx.body += 'world';
                return next();
            });


            router.get('/', {
                test: true,
                test2: true
            }, () => {});

            app.use(router.routes());

            request(app.listen())
                .get('/')
                .expect(200)
                .expect('helloworld')
                .end(done);
        });

        it('should work from parent', done => {
            const app = new Koa();
            const router = new Router();
            const router2 = new Router();

            router.get('/', {
                test: true
            }, () => {});

            router2.plugin('test', (ctx, next) => {
                ctx.body = 'world';
                return next();
            });

            router2.mount('/plop', router);

            app.use(router2.routes());

            request(app.listen())
                .get('/plop')
                .expect(200)
                .expect('world')
                .end(done);
        });

        it('should work with use', done => {
            const app = new Koa();
            const router = new Router();

            router.plugin('test', (ctx, next) => {
                ctx.body = 'hello';
                return next();
            });

            router.use({
                test: true
            });

            router.get('/', () => {});

            app.use(router.routes());

            request(app.listen())
                .get('/')
                .expect(200)
                .expect('hello')
                .end(done);
        });

        it('should work with multiple middleware', done => {
            const app = new Koa();
            const router = new Router();

            const m1 = (ctx, next) => {
                ctx.body = '1';
                return next();
            };

            const m2 = (ctx, next) => {
                ctx.body += '2';
                return next();
            };
            const m3 = (ctx, next) => {
                ctx.body += '3';
                return next();
            };

            router.plugin('test', [m1, m2], m3);

            router.use({
                test: true
            });

            router.get('/', ctx => {
                ctx.body += '4';
            });

            app.use(router.routes());

            request(app.listen())
                .get('/')
                .expect(200)
                .expect('1234')
                .end(done);
        });
    });

    describe('sanitizePath', () => {
        const router = new Router();

        it('should return / with no path', done => {
            const path = router.sanitizePath();
            path.should.be.equal('/');
            done();
        });
        it('should return /pouet with pouet path', done => {
            const path = router.sanitizePath('pouet');
            path.should.be.equal('/pouet');
            done();
        });
        it('should return /pouet with ////pouet path', done => {
            const path = router.sanitizePath('////pouet');
            path.should.be.equal('/pouet');
            done();
        });
        it('should return /pouet with pouet//// path', done => {
            const path = router.sanitizePath('pouet////');
            path.should.be.equal('/pouet');
            done();
        });
        it('should return /pouet with ////pouet//// path', done => {
            const path = router.sanitizePath('////pouet////');
            path.should.be.equal('/pouet');
            done();
        });
        it('should return /pouet/pouet with ////pouet/pouet/// path', done => {
            const path = router.sanitizePath('////pouet/pouet///');
            path.should.be.equal('/pouet/pouet');
            done();
        });
        it('should return /pouet/pouet with ////pouet/////pouet/// path', done => {
            const path = router.sanitizePath('////pouet////pouet///');
            path.should.be.equal('/pouet/pouet');
            done();
        });
    });
});
