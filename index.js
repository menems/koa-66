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

            const middlewares = [];
            const allowed = [];
            let matched = false;
            this.stacks.forEach( route => {
                // path test
                if(!route.regexp.test(ctx.path)) return;

                // use middlewares
                if (!route.method) {
                    middlewares.push(route.middleware);
                    if (route.paramNames)
                        ctx.params = this.parseParams(route.paramNames, ctx.path.match(route.regexp).slice(1))
                    return;
                }

                if ( route.method === 'GET')
                    allowed.push('HEAD');
                allowed.push(route.method);

                // method test
                if ((route.method === ctx.method) || (ctx.method === 'HEAD' && route.method === 'GET')) {
                    matched = true;
                    middlewares.push(route.middleware);
                    if (route.paramNames)
                        ctx.params = this.parseParams(route.paramNames, ctx.path.match(route.regexp).slice(1))
                }
            });

            // only use middleware
            if (!allowed.length) return next();

            // 501
            if(this.methods.indexOf(ctx.method.toLowerCase()) === -1) {
                ctx.status = 501;
                return next();
            }

            // 405
            if (!matched) {
                ctx.status = 405;
                ctx.set('Allow', allowed.filter( (value, index, self) => {
                    return self.indexOf(value) === index;
                }));
                return next();
            }

            return compose(middlewares)(ctx).then(() => next());
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
    parseParams(paramNames, captures) {
        const len = captures.length;
        this.params = this.params || {};

        for (let i = 0; i < len; i++) {
            if (paramNames[i]) {
                let c = captures[i];
                this.params[paramNames[i].name] = c ? decodeURIComponent(c) : c;
            }
        }
        return this.params;
    };

}
