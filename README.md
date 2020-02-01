# jscodeshift-build-import-list

[![Build Status](https://travis-ci.org/codemodsquad/jscodeshift-build-import-list.svg?branch=master)](https://travis-ci.org/codemodsquad/jscodeshift-build-import-list)
[![Coverage Status](https://codecov.io/gh/codemodsquad/jscodeshift-build-import-list/branch/master/graph/badge.svg)](https://codecov.io/gh/codemodsquad/jscodeshift-build-import-list)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

build a list of all files and dependencies transitively imported by starting file(s)

# Installation

```sh
npm install --save-dev jscodeshift-build-import-list
```

# Limitations

Requires Node >= 8.

Dynamic `require()` and `import()` paths are not supported; an `Error` will be
thrown if dynamic path is encountered.  However, it does support calls
to [`require-glob`](https://github.com/shannonmoeller/require-glob) with a
string literal argument.

# API

## `buildImportList(files)`

Builds a list of all files and npm packages imported from the given `files`,
the files imported by them, and sort forth.

### `files` (`string | string[]`)

The file(s) to start from.

### Returns (`{files: Set<string>, dependencies: Set<string>}`)

An object with two properties:

#### `files`

A `Set` of local files transitively imported by the starting file(s)

#### `dependencies`

A `Set` of npm packages transitively imported by the starting file(s)
