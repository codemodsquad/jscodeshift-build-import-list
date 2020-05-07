const { describe, it } = require('mocha')
const { expect } = require('chai')
const buildImportList = require('..')
const path = require('path')

describe('buildImportList', function() {
  it(`works`, async function() {
    const { files, dependencies } = await buildImportList([
      path.relative(process.cwd(), require.resolve('./project')),
      path.relative(process.cwd(), require.resolve('./project/server')),
    ])
    expect([...files].sort()).to.deep.equal([
      require.resolve('./project/index.js'),
      require.resolve('./project/server/index.js'),
      require.resolve('./project/server/models/Post.js'),
      require.resolve('./project/server/models/User.js'),
      require.resolve('./project/server/models/index.js'),
      require.resolve('./project/universal/bar.js'),
      require.resolve('./project/universal/foo.js'),
      require.resolve('./project/universal/render.js'),
    ])
    expect([...dependencies].sort()).to.deep.equal([
      '@jcoreio/gridutil',
      'express',
      'lodash',
      'require-glob',
      'sequelize',
    ])
  })
  it(`throws on dynamic require`, async function() {
    try {
      await buildImportList(
        require.resolve('./project/universal/dynamicRequire')
      )
      throw new Error('expected an error')
    } catch (error) {
      expect(error.message).to.match(/unsupported dynamic path/i)
    }
  })
  it(`throws on dynamic import`, async function() {
    try {
      await buildImportList(
        require.resolve('./project/universal/dynamicImport')
      )
      throw new Error('expected an error')
    } catch (error) {
      expect(error.message).to.match(/unsupported dynamic path/i)
    }
  })
})
