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
    'delete',
    'del'
];

describe('Koa-66', () => {

    describe('core', () => {

        it('path is required', done => {
            const router = new Router();
            try {
                router.get();
                done(Error());
            } catch (e) {
                e.message.should.equal('path is required');
                done();
            }
        });

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
                router.get('/', {});
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
                ctx.body = 'wor'
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
    });

    describe('methods()', () => {
        methods.forEach(m => {
            it(`should work with ${m}`, (done) => {
                const app = new Koa();
                const router = new Router();

                router[m]('/hello', ctx => ctx.body = 'world');

                app.use(router.routes());

                request(app.listen())
                    [m]('/hello')
                    .expect(200)
                    .expect(m == 'head' ? '' : 'world')
                    .end(done);
            })
        });

        it('should work with all', (done) => {
          const app = new Koa();
          const router = new Router();
          let remained = methods.length

          router.all('/hello', ctx => ctx.body = 'world');

          app.use(router.routes());

          methods.forEach((m, index) => {
            request(app.listen())
                [m]('/hello')
                .expect(200)
                .expect(m == 'head' ? '' : 'world')
                .end((err) => {
                  if (err) done(err);
                  else if (--remained === 0) done();
                });
          });
        })
    });


    describe('mount()', () => {


        it('.mount should 200 with correct path', done => {
            const app = new Koa();
            const router = new Router();
            const router2 = new Router();

            router.get('/', ctx => ctx.body = 'world');

            router2.mount('/hello', router)

            app.use(router2.routes());

            request(app.listen())
                .get('/hello')
                .expect(200)
                .expect('world')
                .end(done);
        });

        it('.mount should 404 with old path', done => {
            const app = new Koa();
            const router = new Router();
            const router2 = new Router();

            router.get('/', ctx => ctx.body = 'world');

            router2.mount('/hello', router)

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
                ctx.body = 'hello'
                next();
            })

            router.get('/', ctx => ctx.body += 'world');

            router2.mount('/hello', router)

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
                ctx.body = 'hello'
                next();
            })

            router.get('/', ctx => ctx.body += 'world');
            router2.get('/', ctx => ctx.body += 'pouet');

            router2.mount('/hello', router)

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

            router2.mount('/:one', router)

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
                ctx.body = 'wor'
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
                },
                ctx => ctx.body += 'world'
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

            router.get('/', ctx => {});
            app.use(router.routes());

            request(app.listen())
                .search('/')
                .expect(501)
                .end(done);
        });

        it('throw option, should throw 501 on not implemented methods', done => {
            const app = new Koa();
            const router = new Router();
            router.get('/', ctx => {});

            app.use(router.routes({throw: true}));
            app.on('error', function(err) {
                if (err.name == 'NotImplementedError' && err.statusCode == 501)
                    return done();
                done(Error());
            })

            request(app.listen())
                .search('/')
                .end();
        });

        it('should return 405 on not allowed method', done => {
            const app = new Koa();
            const router = new Router();

            router.use(ctx => {});
            router.get('/', ctx => {});
            router.get('/', ctx => {});
            router.put('/', ctx => {});
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
            router.get('/', ctx => {});
            router.get('/', ctx => {});
            router.put('/', ctx => {});

            app.use(router.routes({throw: true}));

            app.on('error', function(err) {
                if (err.name == 'MethodNotAllowedError'
                    && err.statusCode == 405
                    && err.headers && err.headers.allow && err.headers.allow === 'HEAD, GET, PUT')
                    return done();
                done(Error());
            })

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
    })

    describe('param()', () => {

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
                .param('user', (ctx, next, id) => {
                    ctx.user = {
                        name: 'alex'
                    };
                    if (ctx.ranFirst) {
                        ctx.user.ordered = 'parameters';
                    }
                    next();
                })
                .param('first', (ctx, next, id) => {
                    ctx.ranFirst = true;
                    if (ctx.user) {
                        ctx.ranFirst = false;
                    }
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

    });

});
