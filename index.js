'use strict';

const debug = require('debug')('koa-66');
const assert = require('assert');
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

        this.methods = [
            'options',
            'head',
            'get',
            'post',
            'put',
            'patch',
            'delete',
            'del'
        ];

        this.methods.forEach(method => {
            this[method] = function() {
                const args = Array.prototype.slice.call(arguments);

                assert(typeof args[0] === 'string', 'path is required');

                args.unshift(method);
                return this.register.apply(this, args);
            }.bind(this);
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
        assert(router instanceof Koa66, 'require a Koa66 instance');
        router.stacks.forEach( s => this.register(s.method, prefix + s.path, s.middleware));
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
            //match du path
            let routes = this.stacks.filter(s => s.regexp.test(ctx.path));

            // check if a route is reached
            if(!routes.filter(r => r.method).length) return next();

            // 501
            if(this.methods.indexOf(ctx.method.toLowerCase()) === -1) {
                ctx.status = 501;
                return next();
            }

            const allowed = [];
            // match method
            routes = routes.filter(r => {
                if (r.method) {
                    allowed.push(r.method);
                    return r.method === ctx.method;
                }
                return true;
            });

            if (!routes.length) {
                ctx.status = 405;
                ctx.set('Allow', allowed);
                return next();
            }

            const _m = routes.map(r => {
                if (r.path && r.paramNames) {
                    ctx.params = this.params = this.parseParams(r.paramNames, ctx.path.match(r.regexp).slice(1), this.params)
                }
                return r.middleware;
            });

            return compose(_m)(ctx).then(() => next());
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
    register(method, path) {
        debug('Register %s %s', method, path);
        const middlewares = Array.prototype.slice.call(arguments, 2);

        assert(middlewares.length, 'middleware is required');

        middlewares.forEach(m => {
            if ( Array.isArray(m)) {
                m.forEach( _m => this.register(method, path, _m));
                return this;
            }

            assert(typeof m === 'function', 'middleware must be a function');

            const keys = [];
            const regexp = pathToRegexp(path, keys);

            var route = {
                path: path,
                middleware: m,
                regexp: regexp,
                paramNames: keys
            };

            if (method)
                route.method = method.toUpperCase();

            this.stacks.push(route);
        });
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
        const params = existingParams || {};
        const len = captures.length;

        for (let i = 0; i < len; i++) {
            if (paramNames[i]) {
                let c = captures[i];
                params[paramNames[i].name] = c ? decodeURIComponent(c) : c;
            }
        }

        return params;
    };

}
