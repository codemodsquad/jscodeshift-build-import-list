const j = require('jscodeshift').withParser('babylon')
const recast = require('recast')
const path = require('path')
const fs = require('fs-extra')

const fileModuleNamePattern = /^[./]/
const packageNamePattern = /^(@(.+?)\/)?([^/]+)/

const isTrueRequire = path => path.scope.getBindings().require == null

async function buildImportList(startingFiles) {
  if (typeof startingFiles === 'string') startingFiles = [startingFiles]

  const files = new Set(startingFiles.map(file => path.resolve(file)))
  const dependencies = new Set()

  async function processImport(file, moduleName) {
    const isFileModuleName = fileModuleNamePattern.test(moduleName)
    if (isFileModuleName) {
      moduleName = require.resolve(moduleName, {
        paths: [path.dirname(file)],
      })
      if (files.has(moduleName)) return
      files.add(moduleName)
      await processFile(moduleName)
    } else {
      const match = packageNamePattern.exec(moduleName)
      if (!match) throw new Error(`invalid package name: ${moduleName}`)
      const [packageName] = match
      if (dependencies.has(packageName)) return
      dependencies.add(packageName)
    }
  }

  async function processFile(file) {
    const code = await fs.readFile(file, 'utf8')
    const root = j(code)
    await Promise.all(root.find(j.ImportDeclaration).nodes().map(
      node => processImport(file, node.source.value)
    ))
    await Promise.all(root.find(j.CallExpression, {
      callee: {name: 'require'},
    }).filter(isTrueRequire).nodes().map(
      async node => {
        if (!node.arguments.length || node.arguments[0].type !== 'StringLiteral') {
          throw new Error(`unsupported dynamic require path in ${file} (${node.loc.start.line}:${node.loc.start.column}):
  ${recast.print(node).code}`)
        }
        return await processImport(file, node.arguments[0].value)
      }
    ))
    await Promise.all(root.find(j.CallExpression, {
      callee: {type: 'Import'},
    }).nodes().map(
      async node => {
        if (!node.arguments.length || node.arguments[0].type !== 'StringLiteral') {
          throw new Error(`unsupported dynamic import path in ${file} (${node.loc.start.line}:${node.loc.start.column}):
  ${recast.print(node).code}`)
        }
        return await processImport(file, node.arguments[0].value)
      }
    ))
  }

  await Promise.all(startingFiles.map(processFile))

  return {files, dependencies}
}

module.exports = buildImportList

// istanbul ignore next
if (!module.parent) {
  module.exports(process.argv.slice(2)).then(
    ({files, dependencies}) => {
      console.log('Files:'); // eslint-disable-line no-console
      [...files].sort().forEach(file => console.log(' ', file)) // eslint-disable-line no-console
      console.log('Dependencies:'); // eslint-disable-line no-console
      [...dependencies].sort().forEach(dependencies => console.log(' ', dependencies)) // eslint-disable-line no-console
      process.exit(0)
    },
    (err) => {
      console.error(err.stack) // eslint-disable-line no-console
      process.exit(1)
    }
  )
}
