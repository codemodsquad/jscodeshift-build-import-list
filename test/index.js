const {describe, it} = require('mocha')
const {expect} = require('chai')
const buildImportList = require('..')
const path = require('path')

describe('buildImportList', function () {
  it(`works`, async function () {
    const {files, dependencies} = await buildImportList([
      path.relative(process.cwd(), require.resolve('./project')),
      path.relative(process.cwd(), require.resolve('./project/server')),
    ])
    expect([...files].sort()).to.deep.equal([
      '/Users/andy/jscodeshift-build-import-list/test/project/server/index.js',
      '/Users/andy/jscodeshift-build-import-list/test/project/universal/bar.js',
      '/Users/andy/jscodeshift-build-import-list/test/project/universal/foo.js',
      '/Users/andy/jscodeshift-build-import-list/test/project/universal/render.js',
      'test/project/index.js',
      'test/project/server/index.js',
    ])
    expect([...dependencies].sort()).to.deep.equal([
      '@jcoreio/gridutil',
      'express',
      'lodash',
    ])
  })
  it(`throws on dynamic require`, async function () {
    try {
      await buildImportList(require.resolve('./project/universal/dynamicRequire'))
      throw new Error('expected an error')
    } catch (error) {
      expect(error.message).to.match(/unsupported dynamic require path/i)
    }
  })
  it(`throws on dynamic import`, async function () {
    try {
      await buildImportList(require.resolve('./project/universal/dynamicImport'))
      throw new Error('expected an error')
    } catch (error) {
      expect(error.message).to.match(/unsupported dynamic import path/i)
    }
  })
})
