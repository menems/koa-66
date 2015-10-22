const debug = require('debug')('koa-66');
const assert = require('assert');
const methods = require('methods');
const pathToRegexp = require('path-to-regexp');
const compose = require('koa-compose');

module.exports = class Koa66 {

    constructor(options) {
        this.stacks = [];

        methods.forEach(method => {
            this[method] = (path, middleware) => {
                return this.register(method, path, middleware);
            };
        });
    }

    register(method, path, middleware) {
        var route = {
            path: path,
            middleware: middleware
        };

        // use middleware
        if (!method) {
            debug('Register use %s', path);
            route.regexp = new RegExp(path + '(.*)');
        }
        // reel routes
        else {
            debug('Register route %s %s', method, path);
            let keys = [];
            let regexp = pathToRegexp(path, keys);
            route.method = method.toUpperCase();
            route.regexp = regexp;
            route.paramNames = keys;
        }

        this.stacks.push(route);
        return this;
    }

    mount(prefix, router) {
        assert(router.constructor.name === 'Koa66', 'require a Koa66 instance');

        router.stacks.forEach((s) => {
            this.register(s.method, prefix + s.path, s.middleware);
        });

        return this;
    }

    use(path, fn) {
        if (typeof path === 'function') {
            fn = path;
            path = '/';
        }
        return this.register(false, path, fn);
    }

    routes() {
        return (ctx, next) => {
            let routes = this.match(ctx.method, ctx.path);

            // check if a route is reached
            let hasRoute = routes.filter((r) => {
                return r.method;
            });

            if (!hasRoute.length)
                return next(ctx);

            let _m = [];
            routes.forEach((r) => {
                if (r.path) {
                    ctx.params = this.params = this.parseParams(r.paramNames, ctx.path.match(r.regexp).slice(1), this.params)
                }
                _m.push(r.middleware);
            });

            return compose(_m)(ctx).then(function() {
                return next(ctx);
            });
        };
    }

    parseParams(paramNames, captures, existingParams) {
        let params = existingParams || {};

        for (let len = captures.length, i = 0; i < len; i++) {
            if (paramNames[i]) {
                let c = captures[i];
                params[paramNames[i].name] = c ? safeDecodeURIComponent(c) : c;
            }
        }
        return params;
    };

    match(method, path) {
        debug('Route %s %s', method, path);
        return this.stacks.filter((s) => {
            debug('Test with %s %s, matched: %s', s.method, s.regexp);
            if (s.regexp.test(path) && (!s.method || s.method === method))
                return s;
        });
    }
}

/**
 * Safe decodeURIComponent, won't throw any error.
 * If `decodeURIComponent` error happen, just return the original value.
 *
 * @param {String} text
 * @returns {String} URL decode original string.
 * @private
 */
function safeDecodeURIComponent(text) {
    try {
        return decodeURIComponent(text);
    } catch (e) {
        return text;
    }
}
