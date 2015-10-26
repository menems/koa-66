# koa-66

Router middleware for the next release of [koa](https://github.com/koajs/koa).

Inspired by [koa-router](https://github.com/alexmingoia/koa-router)

## why?
Why not using [koa-route](https://github.com/koajs/route)?
- Is a litle bit minimalistic

Why not using [koa-router](https://github.com/alexmingoia/koa-router)
- For the moment koa-router is broken on the new koa release [#186](https://github.com/alexmingoia/koa-router/issues/186)
- I think koa-router do too much things, redirect, named route, url and need too add another middleware for allowed methods

## Requirement

- __node v4__ or higher

## Instalation

```bash
# npm install koa-66
```
## Features

- Express style http verbs methods
- Express style use function
- promised-based function
- mount instance routes on specific path
- multiple middleware as arguments
- multiple middleware as array
- 501 and 405 status

## Usage

```js
const Koa = require('koa');
const Router = require('koa-66');
const app = new Koa();

const router = new Router();
const mainRouter  = new Router();

router.use(async function(ctx, next) {
    ctx.a = " world";
    await next();
});

router.get('/', (ctx, next) => {
    return next().then(() => {
        ctx.body += ctx.a;
   })
});

router.get('/', async ctx => {
    ctx.body = await Promise.resolve('hello');
});

mainRouter.mount('/pouet', router);

app.use(mainRouter.routes());

app.listen(1664);
```

## Test
```bash
# npm test

```
