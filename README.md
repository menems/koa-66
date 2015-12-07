# koa-66

[![Node.js Version][node-image]][node-url]
[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Dependency Status][dep-image]][dep-url]
[![Coverage Status][cov-img]][cov-url]

Router middleware for [koa](https://github.com/koajs/koa/tree/v2.x) v2.

> feedbacks are welcome

## Features

- [Plugin middleware support](https://github.com/menems/koa-66#plugin-support)
- Express like http verbs methods (including `all`)
- Express like use function
- Express like param function
- Automatic OPTIONS response
- Automatic HEAD when GET is present
- 501 and 405 status (throw capability with headers)
- Mount instance on specific path
- Multiple middleware as arguments
- Multiple middleware as array

## Installation

```bash
# npm install koa-66
```

## Example

```js
const Koa = require('koa');
const Router = require('koa-66');
const app = new Koa();

const router = new Router();
const mainRouter  = new Router();

router.param('id', (ctx, next, id) => {
        ctx.yolo = id;
        return next();
});

router.use(async function(ctx, next) {
    ctx.a = " ";
    await next();
});

router.get('/:id', (ctx, next) => {
    return next().then(() => {
        ctx.body += ctx.a + ctx.yolo;
   })
});

router.get('/:id', async function(ctx) {
    ctx.body = await Promise.resolve('hello');
});

mainRouter.mount('/pouet', router);

app.use(mainRouter.routes());

app.listen(1664);
// GET http://localhost:1664/pouet/world
// => hello world
```

## Example with __throw__ option
```javascript
const Koa = require('koa');
const Router = require('koa-66');
const app = new Koa();

const router = new Router();

app.use(async function(ctx, next) {
	try {
		await next();
	}catch(e){
		if(e.status === 405) {
			ctx.status = 405;
			ctx.set(e.headers);
		}
	}
})

router.get('/', (ctx) => ctx.body = 'hello');

app.use(router.routes({throw: true}));

app.listen(1664);

// > curl http://localhost:1664/ -I -X POST
//
// HTTP/1.1 405 Method Not Allowed
// allow: HEAD, GET
// Content-Type: text/plain; charset=utf-8
// Content-Length: 18
// Date: Wed, 04 Nov 2015 10:29:06 GMT
// Connection: keep-alive

```

## Plugin support

I don't know if Plugin is a good term for this feature.
The goal was to add cappability to register some middleware on a main Router that will be inject via config object on different route.
(ex: authentication  or acl behaviour).
Why? Because I am lazy to require some middleware in all my router script with generaly relatif path...

So I decided to add the possibility to inject an object at first parameter (that will be a config object) and adding an extra middleware that will be inject in middleware stack. To register this plugin just use a `plugin()`method.

```javascript
const Router = require('koa-66');
const main = new Router();

// you can use multiple middleware as arguments or array
main.plugin('authent', (ctx, next) => {
    // pick plugin config object on ctx.state.plugins.
    // here ctx.state.plugins.authent === true;
	// do stuff inject user on context for example
	return next();
	//or throw or do nothing that will stop execution of router stack
})

main.plugin('acl', (ctx, next) => {
    // here ctx.state.plugins.acl === ['admin'];
	// do stuff check role via ctx.state.plugins.acl for example
	return next();
	//or throw or do nothing that will stop execution of router stack
})

const router = new Router();

router.use({authent: true});
//options here is a boolean,
//but you can pass everything you want,
//and it will be inject as options

router.get('/private', {acl:['admin']}, 
	ctx => ctx.body = 'private'
)

main.mount('/api', router);
...	
// order of call /api/private
// 1 plugin authent
// 2 plugin acl
// 3 real middleware 

``` 

## Test
```bash
# npm test

```

[node-image]: https://img.shields.io/node/v/koa-66.svg?style=flat-square
[node-url]: https://nodejs.org
[npm-image]: https://img.shields.io/npm/v/koa-66.svg?style=flat-square
[npm-url]: https://npmjs.org/package/koa-66
[travis-image]: https://img.shields.io/travis/menems/koa-66/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/menems/koa-66
[dep-image]: http://david-dm.org/menems/koa-66.svg?style=flat-square
[dep-url]:http://david-dm.org/menems/koa-66
[cov-img]:https://coveralls.io/repos/menems/koa-66/badge.svg?branch=master&service=github
[cov-url]:https://coveralls.io/github/menems/koa-66?branch=master
