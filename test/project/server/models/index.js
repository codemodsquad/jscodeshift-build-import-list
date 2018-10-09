import Sequelize from 'sequelize'
import requireGlob from 'require-glob'

const models: {[name: string]: Class<Sequelize.Model<any>>} = {}
const modules = requireGlob.sync('./*.js')
for (let file in modules) {
  const _module = modules[file]
  if (_module === module.exports) continue
  // $FlowFixMe
  const model = _module.default
  if (model && model.prototype instanceof Sequelize.Model) models[model.name] = model
}

export default models
