
v0.8.4 / 2015-12-09
===================

  * Call param() middleware before the first actual match.

v0.8.3 / 2015-12-07
===================

  * fix: plugin need return

v0.8.2 / 2015-12-07
===================

  * fix: remove instanceof test on mount. (too many problem with npm link and different version)

v0.8.1 / 2015-12-07
===================

  * fix: plugins options are now in context

v0.8.0 / 2015-12-03
===================

  * chores: lint test
  * feat: remove del , no more reserved word
  * chores: lint
  * chore: typo

v0.7.3 / 2015-11-23
===================

  * chore: typo
  * attach the route to the context
  * chore : dependencies, readme

v0.7.2 / 2015-11-19
===================

  * test: add more test for no path and all method
  * chore: Readme update
  * feat: add multiple args on plugin
  * fix: bad test

v0.7.1 / 2015-11-14
===================

  * fix: resolve should have result...  #14

v0.7.0 / 2015-11-13
===================

  * feat: no path needed now, default to /
  * feat: add sanitizePath method
  * feat: add plugin support
  * refactor: remove unnecessary () and {}

v0.6.1 / 2015-11-11
===================

  * test: missing test
  * perf: remove unnecessary branch
  * chore : add istanbul, coverage

v0.6.0 / 2015-11-05
===================

  * chore: Readme update
  * refactor: remove const Koa66
  * fix: remove del from allow methods
  * feat: Support all() method for Router

v0.5.4 / 2015-11-04
===================

  * feat: Add throw option on routes();
  * chore: add dependencies badge + var -> const

v0.5.3 / 2015-11-02
===================

  * refactor: test with arrow function
  * chore: readme.md, package.json update

v0.5.2 / 2015-11-02
===================
  * wtf npm

v0.5.1 / 2015-11-02
===================

  * Fix test and add badges
  * dep: change to koa 2.0.0-alpha.2
  * Add travis
  * fix: readme

v0.5.0 / 2015-10-30
===================

  * Readme changed
  * fix: param() on children mount instance
  * Replace assert by throw
  * Add param() api
  * fix: no use of this in parseParams

v0.4.0 / 2015-10-29
===================

  * Add History.md
  * Add automatic options response
  * fix: methods on prototype instead in constructor
  * fix: multiple middleware on use functions
  * readme update

v0.3.0 / 2015-10-26
===================

  * refactor routes() and add HEAD request
  * add del to methods
  * don't catch decodeURIComponent error
  * Add 501 and 405

v0.2.2 / 2015-10-26
===================

  * fix readme

v0.2.1 / 2015-10-26
===================

  * More readme
  * remove unnecessary context param
  * Use instanceof instead of constructor.name
  * remove methods dependencies + refactor + multiple routes and middlewares

v0.1.3 / 2015-10-23
===================

  * fix: next call doesn't need ctx
  * Add sync test
  * Add install on readme
  * add babel as dependencies for test
  * Add eslint config
  * Add comments

v0.1.1 / 2015-10-22
===================

  * readme: add example
  * fix: use regexp
  * Initial commit

