const fs = require('fs')

const existingCustomSounds = require('../data/customSounds')
const existingSoundTS = {}
for (let hero in existingCustomSounds) {
  existingSoundTS[hero] = {}
  for (let type in existingCustomSounds[hero]) {
    existingSoundTS[hero][type] = {}
    for (let sound of existingCustomSounds[hero][type]) {
      existingSoundTS[hero][type][sound.id] = sound.ts
    }
  }
}

const newTime = Date.now()

const dirs = ['unknown', 'athena', 'hollywood-guy', 'lucioball', 'snowball-offensive', 'uprising', 'junkenstein']

const out = {}
dirs.forEach(thing => {
  if (!out[thing]) out[thing] = {'base': []}
  fs.readdirSync(`../sounds/${thing}`).forEach(sound => {
    if (!sound.endsWith('.ogg')) return
    const split = sound.split('-')
    const soundID = split[split.length -1].slice(0, -4)
    const ts = existingSoundTS[thing]['base'][soundID] || newTime
    out[thing]['base'].push({ id: soundID, ts })
  })
})

fs.writeFileSync('../data/customSounds.json', JSON.stringify(out, null, 2))