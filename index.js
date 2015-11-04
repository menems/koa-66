'use strict';

const debug = require('debug')('koa-66');
const pathToRegexp = require('path-to-regexp');
const compose = require('koa-compose');

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

/**
 * Expose Koa66 class.
 */
const Koa66 = module.exports = class Koa66 {

    /**
     * Initialise a new Koa66
     *
     * @api public
     */
    constructor() {
        this.stacks = [];
        this.methods = methods;
    }

    /**
     * Mount a Koa66 instance on a prefix path
     *
     * @todo: too memory expensive instance are clone
     * maybe add a keep args to remove the router instance mounted!
     *
     * @param  {string} prefix
     * @param  {Object} router  Koa66 instance
     * @return {Object}         Koa66 instance
     * @api public
     */
    mount(prefix, router) {
        if(!router instanceof Koa66)
            throw new TypeError('require a Koa66 instance');

        router.stacks.forEach(s => {
            if(s.paramKey) {
                this.register(s.methods, prefix + s.path, s.paramKey, s.middleware);
            }else {
                this.register(s.methods, prefix + s.path, s.middleware);
            }
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
        const args = Array.prototype.slice.call(arguments);
        if (typeof args[0] === 'function')
            args.unshift('(.*)');
        args.unshift(false);
        return this.register.apply(this, args);
    }

    /**
     * param express like function
     *
     * @param  {String}   key
     * @param  {Function} fn
     * @return {Object}
     */
    param(key, fn) {
        if(typeof key !== 'string' || typeof fn !== 'function')
            throw new TypeError('usage: param(string, function)');
        return this.register(false, '(.*)', key, fn);
    }

    /**
     * Expose middleware for koa
     *
     * @return {Function}
     * @api public
     */
    routes(options) {

        options = options || {};

        return (ctx, next) => {

            const middlewares = [];
            const allowed = [];
            const paramMiddlewares = [];
            let matched;

            this.stacks.forEach(route => {
                // path test
                if (!route.regexp.test(ctx.path)) return;

                if (route.paramNames)
                    ctx.params = this.parseParams(ctx.params, route.paramNames, ctx.path.match(route.regexp).slice(1))

                if (route.paramKey)
                    return paramMiddlewares[route.paramKey] = (ctx, next) => {
                        return (ctx.params[route.paramKey])
                            ? route.middleware(ctx, next, ctx.params[route.paramKey])
                            : next();
                    };

                if (!route.methods)
                    return middlewares.push(route.middleware);

                if (route.methods.indexOf('GET') !== -1)
                    allowed.push('HEAD');
                route.methods.forEach(m => allowed.push(m));

                // method test
                if ((route.methods.indexOf(ctx.method) !== -1) ||
                    (ctx.method === 'HEAD' && route.methods.indexOf('GET') !== -1)) {
                    matched = true;
                    middlewares.push(route.middleware);
                }
            });

            // only use middleware
            if (!allowed.length) return next();

            // 501
            if (this.methods.indexOf(ctx.method.toLowerCase()) === -1) {
                if (options.throw)
                    ctx.throw(501);
                ctx.status = 501;
                return next();
            }

            // 405
            if (!matched) {
                // automatic OPTIONS response
                if (ctx.method === 'OPTIONS') {
                    ctx.status = 204
                    return next();
                }

                const _allowed = allowed.filter((value, index, self) => self.indexOf(value) === index).join(', ');

                if (options.throw)
                    ctx.throw(405, {headers: {allow : _allowed}});
                ctx.status = 405;
                ctx.set('Allow', _allowed);
                return next();
            }

            const _params = [];
            for(let i in ctx.params) {
                if( paramMiddlewares[i])
                    _params.push(paramMiddlewares[i]);
            }
            // param fn at first
            return compose(_params.concat(middlewares))(ctx).then(() => next());
        };
    }

    /**
     * Register a route for all methods.
     *
     * @param  {String}  path
     * @return {[Functions]...}  middleware
     */
    all() {
      const args = Array.prototype.slice.call(arguments);

      if (typeof args[0] !== 'string')
          throw new TypeError('path is required');

      args.unshift(methods.slice(0, -1));
      return this.register.apply(this, args);
    }

    /**
     * Register a new middlewate, http route or use middeware
     *
     * @param  {string} methods
     * @param  {string} path
     * @param  {Function} middleware
     * @return {Object} Koa66 instance
     * @api private
     */
    register(methods, path) {
        debug('Register %s %s', methods, path);
        let middlewares;
        let paramKey;
        if (typeof arguments[2] === 'string') {
            paramKey = arguments[2];
            middlewares = Array.prototype.slice.call(arguments, 3);
        } else {
            middlewares = Array.prototype.slice.call(arguments, 2);
        }

        if (!middlewares.length)
            throw new Error('middleware is required');

        middlewares.forEach(m => {
            if (Array.isArray(m)) {
                m.forEach(_m => this.register(methods, path, _m));
                return this;
            }

            if ( typeof m !== 'function')
                throw new TypeError('middleware must be a function');

            const keys = [];
            const regexp = pathToRegexp(path, keys);

            const route = {
                path: path,
                middleware: m,
                regexp: regexp,
                paramNames: keys
            };

            if (paramKey) route.paramKey = paramKey;

            if (methods) route.methods = methods.map((m) => m.toUpperCase());

            this.stacks.push(route);
        });
        return this;
    }

    /**
     * parse params from route
     *
     * @param  {[Object]} paramNames
     * @param  {[String]} captures
     * @return {[Object]}
     * @api private
     */
    parseParams(params, paramNames, captures) {
        const len = captures.length;
        params = params || {};

        for (let i = 0; i < len; i++) {
            if (paramNames[i]) {
                let c = captures[i];
                params[paramNames[i].name] = c ? decodeURIComponent(c) : c;
            }
        }
        return params;
    };
}

/**
 * Add http methods
 *
 * @param  {String}  path
 * @return {[Functions]...}  middleware
 */
methods.forEach(method => {
    Koa66.prototype[method] = function() {
        const args = Array.prototype.slice.call(arguments);

        if (typeof args[0] !== 'string')
            throw new TypeError('path is required');

        args.unshift([method]);
        return this.register.apply(this, args);
    };
});
