const fs = require('fs')
const _ = require('lodash')
const data = require('./debugMapping')

fs.readdirSync('./').forEach(file => {
  if (!file.endsWith('.ogg')) return
  const [, fileName] = file.split('-')
  if (!fileName) return
  const id = fileName.slice(0, -4)
  const hero = _.get(data, [id, 'hero'])
  console.log(id, hero)
  if (!hero) return
  fs.renameSync(file, `${hero}-${id}.ogg`)
})
