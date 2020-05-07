const j = require('jscodeshift').withParser('babylon')
const glob = require('glob')
const { promisify } = require('es6-promisify')
const recast = require('recast')
const path = require('path')
const fs = require('fs-extra')

const fileModuleNamePattern = /^[./]/
const packageNamePattern = /^(@(.+?)\/)?([^/]+)/

const isTrueRequire = path => path.scope.lookup('require') == null

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

    await Promise.all(
      root
        .find(j.CallExpression)
        .filter(isRequireGlob(root))
        .nodes()
        .map(async node => {
          const { arguments: args } = node
          if (args.length !== 1 || args[0].type !== 'StringLiteral') {
            throw new Error(`unsupported complex require-glob in ${file} (${
              node.loc.start.line
            }:${node.loc.start.column}):
    ${recast.print(node).code}`)
          }
          const files = await promisify(glob)(
            path.resolve(path.dirname(file), args[0].value)
          )
          await Promise.all(
            files.map(moduleName => processImport(file, moduleName))
          )
        })
    )
    await Promise.all(
      root
        .find(j.ImportDeclaration)
        .nodes()
        .map(node => processImport(file, node.source.value))
    )

    await Promise.all(
      root
        .find(j.CallExpression)
        .filter(
          path =>
            (path.node.callee.name === 'require' && isTrueRequire(path)) ||
            path.node.callee.type === 'Import'
        )
        .nodes()
        .map(async node => {
          const arg = node.arguments[0]
          if (!arg) return
          if (arg.type !== 'StringLiteral') {
            throw new Error(`unsupported dynamic path in ${file} (${
              node.loc.start.line
            }:${node.loc.start.column}):
  ${recast.print(node).code}`)
          }
          return await processImport(file, arg.value)
        })
    )
  }

  await Promise.all(startingFiles.map(processFile))

  return { files, dependencies }
}

function findRequireGlobBinding(root) {
  let requireGlobBinding
  const requireGlobImport = root.find(j.ImportDeclaration, {
    source: { value: 'require-glob' },
  })
  if (requireGlobImport.size())
    requireGlobImport.find(j.ImportDefaultSpecifier).forEach(path => {
      requireGlobBinding = path.node.local
    })
  if (requireGlobBinding) return requireGlobBinding
  const requireGlobDeclarator = root
    .find(j.CallExpression, {
      callee: { name: 'require' },
      arguments: [{ type: 'StringLiteral', value: 'require-glob' }],
    })
    .filter(isTrueRequire)
    .closest(j.VariableDeclarator)
  if (requireGlobDeclarator.size()) return requireGlobDeclarator.nodes()[0].id
}

function isRequireGlob(root) {
  const requireGlobBinding = findRequireGlobBinding(root)
  return _path => {
    const { node, scope } = _path
    const { callee } = node
    if (requireGlobBinding) {
      if (
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        callee.property.name === 'sync'
      ) {
        const bindings = scope.getBindings()[callee.object.name]
        if (
          !bindings ||
          !bindings.length ||
          bindings[0].node !== requireGlobBinding
        )
          return false
        if (bindings[0].node !== requireGlobBinding) return false
        return true
      } else if (callee.type === 'Identifier') {
        const bindings = scope.getBindings()[callee.name]
        if (
          !bindings ||
          !bindings.length ||
          bindings[0].node !== requireGlobBinding
        )
          return false
        if (bindings[0].node !== requireGlobBinding) return false
        return true
      }
    }
    if (
      callee.type === 'MemberExpression' &&
      callee.object.type === 'CallExpression' &&
      callee.object.callee.name === 'require' &&
      _path.scope.getBindings().require == null &&
      callee.object.arguments.length &&
      callee.object.arguments[0].value === 'require-glob'
    ) {
      return true
    }
    return false
  }
}

module.exports = buildImportList

// istanbul ignore next
if (!module.parent) {
  module.exports(process.argv.slice(2)).then(
    ({ files, dependencies }) => {
      console.log('Files:') // eslint-disable-line no-console
      ;[...files].sort().forEach(file => console.log(' ', file)) // eslint-disable-line no-console
      console.log('Dependencies:') // eslint-disable-line no-console
      ;[...dependencies]
        .sort()
        .forEach(dependencies => console.log(' ', dependencies)) // eslint-disable-line no-console
      process.exit(0)
    },
    err => {
      console.error(err.stack) // eslint-disable-line no-console
      process.exit(1)
    }
  )
}
