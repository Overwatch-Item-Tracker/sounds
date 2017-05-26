const fs = require('fs')
const ids = require('./ids.json')

fs.readdirSync('./').forEach(sound => {
  const soundID = sound.slice(0, -4)
  if (soundID in ids) fs.renameSync(`./${sound}`, `./garb/${sound}`)
})