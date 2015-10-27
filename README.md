# koa-66

Router middleware for the next release of [koa](https://github.com/koajs/koa).

Inspired by [koa-router](https://github.com/alexmingoia/koa-router)

## why?
Why not use [koa-route](https://github.com/koajs/route)?

- Is a little minimalistic

Why not use [koa-router](https://github.com/alexmingoia/koa-router)?

- For now koa-router is broken with the new koa release [#186](https://github.com/alexmingoia/koa-router/issues/186)

## Requirement

- __node v4__ or higher

## Instalation

```bash
# npm install koa-66
```
## Features

- Express like http verbs methods
- Express like use function
- mount instance on specific path
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
