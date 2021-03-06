# jscodeshift-build-import-list

[![CircleCI](https://circleci.com/gh/codemodsquad/jscodeshift-build-import-list.svg?style=svg)](https://circleci.com/gh/codemodsquad/jscodeshift-build-import-list)
[![Coverage Status](https://codecov.io/gh/codemodsquad/jscodeshift-build-import-list/branch/master/graph/badge.svg)](https://codecov.io/gh/codemodsquad/jscodeshift-build-import-list)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![npm version](https://badge.fury.io/js/jscodeshift-build-import-list.svg)](https://badge.fury.io/js/jscodeshift-build-import-list)

build a list of all files and dependencies transitively imported by starting file(s)

# Installation

```sh
npm install --save-dev jscodeshift-build-import-list
```

# Limitations

Requires Node >= 8.

Dynamic `require()` and `import()` paths are not supported; an `Error` will be
thrown if dynamic path is encountered (unless you have a leading comment containing
`@jscodeshift-build-import-list ignore`).

However, calls to [`require-glob`](https://github.com/shannonmoeller/require-glob)
with a string literal argument are supported.

# API

## `buildImportList(files)`

Builds a list of all files and npm packages imported from the given `files`,
the files imported by them, and sort forth.

### `files` (`string | string[]`)

The file(s) to start from.

### Returns (`Promise<{files: Set<string>, dependencies: Set<string>}>`)

A `Promise` that will resolve to an object with two properties:

#### `files`

A `Set` of local files transitively imported by the starting file(s)

#### `dependencies`

A `Set` of npm packages transitively imported by the starting file(s)

### Ignoring requires/imports

Add a leading comment containing `@jscodeshift-build-import-list ignore`, for example:

```js
// @jscodeshift-build-import-list ignore
import foo from 'foo'
const bar = /* @jscodeshift-build-import-list ignore */ require(getBarPath())
```
