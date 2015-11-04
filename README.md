# koa-66

[![Node.js Version][node-image]][node-url]
[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Dependency Status][dep-image]][dep-url]

Router middleware for [koa](https://github.com/koajs/koa) v2.
Inspired by [koa-router](https://github.com/alexmingoia/koa-router)

> feedbacks are welcome

## Features

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



## Test
```bash
# npm test

```

## why?
Why not use [koa-route](https://github.com/koajs/route)?

- Is a little minimalistic

Why not use [koa-router](https://github.com/alexmingoia/koa-router)?

- For now koa-router is broken with the new koa release [#186](https://github.com/alexmingoia/koa-router/issues/186)

[node-image]: https://img.shields.io/node/v/koa-66.svg?style=flat-square
[node-url]: https://nodejs.org
[npm-image]: https://img.shields.io/npm/v/koa-66.svg?style=flat-square
[npm-url]: https://npmjs.org/package/koa-66
[travis-image]: https://img.shields.io/travis/menems/koa-66/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/menems/koa-66
[dep-image]: http://david-dm.org/menems/koa-66.svg?style=flat-square
[dep-url]:http://david-dm.org/menems/koa-66
