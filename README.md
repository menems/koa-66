# koa-66

Router middleware for [koa](https://github.com/koajs/koa/tree/async-function) 2, probably the next release

Inspired by [koa-router](https://github.com/alexmingoia/koa-router)

## Requirement

- __node v4__ or higher

## Instalation

```bash
# npm install koa-66
```

## Usage

```js
const Koa = require('koa');
const Router = require('koa-66');
const app = new Koa();

const router = new Router();
const mainRouter  = new Router();

router.use('/', async function(ctx, next) {
    ctx.a = " world";
    await next(ctx);
});

router.get('/', (ctx, next) => {
    return next(ctx).then(() => {
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
