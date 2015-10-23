'use strict';

const debug = require('debug')('koa-66');
const assert = require('assert');
const methods = require('methods');
const pathToRegexp = require('path-to-regexp');
const compose = require('koa-compose');

/**
 * Expose Koa66 class.
 */
module.exports = class Koa66 {

    /**
     * Initialise a new Koa66
     *
     * @api public
     */
    constructor() {
        this.stacks = [];

        methods.forEach(method => {
            this[method] = (path, middleware) => {
                return this.register(method, path, middleware);
            };
        });
    }

    /**
     * Mount a Koa66 instance on a prefix path
     *
     * @param  {string} prefix
     * @param  {Object} router  Koa66 instance
     * @return {Object}         Koa66 instance
     * @api public
     */
    mount(prefix, router) {
        assert(router.constructor.name === 'Koa66', 'require a Koa66 instance');

        router.stacks.forEach((s) => {
            this.register(s.method, prefix + s.path, s.middleware);
        });

        return this;
    }

    /**
     * Use given middleware before route callback
     *
     * @param  {String|Function} path
     * @param  {Function} fn
     * @return {Object} Koa66 instance
     * @api public
     */
    use(path, fn) {
        if (typeof path === 'function') {
            fn = path;
            path = null;
        }
        return this.register(false, path || '(.*)' , fn);
    }

    /**
     * Expose middleware for koa
     *
     * @return {Function}
     * @api public
     */
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
                if (r.path && r.paramNames) {
                    ctx.params = this.params = this.parseParams(r.paramNames, ctx.path.match(r.regexp).slice(1), this.params)
                }
                _m.push(r.middleware);
            });

            return compose(_m)(ctx).then(function() {
                return next();
            });
        };
    }

    /**
     * Register a new middlewate, http route or use middeware
     *
     * @param  {string} method
     * @param  {string} path
     * @param  {Function} middleware
     * @return {Object} Koa66 instance
     * @api private
     */
    register(method, path, middleware) {
        debug('Register %s %s', method, path);
        let keys = [];
        let regexp = pathToRegexp(path, keys);

        var route = {
            path: path,
            middleware: middleware,
            regexp: regexp,
            paramNames: keys
        };

        if (method)
            route.method = method.toUpperCase();

        this.stacks.push(route);
        return this;
    }

    /**
     * parse params from route
     *
     * @param  {[Object]} paramNames
     * @param  {[String]} captures
     * @param  {[Object]} existingParams
     * @return {[Object]}
     * @api private
     */
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

    /**
     * math middleware from a specific path and method
     *
     * @param  {String} method
     * @param  {String} path
     * @return {[Object]}
     * @api private
     */
    match(method, path) {
        debug('Route %s %s', method, path);
        return this.stacks.filter((s) => {
            debug('Test with %s %s, matched: %s', s.method, s.regexp, s.regexp.test(path));
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
