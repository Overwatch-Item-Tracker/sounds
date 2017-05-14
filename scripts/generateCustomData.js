const fs = require('fs')

const dirs = ['unknown', 'athena', 'hollywood-guy', 'lucioball', 'snowball-offensive', 'uprising', 'junkenstein']

const out = {}
dirs.forEach(thing => {
  if (!out[thing]) out[thing] = {'base': []}
  fs.readdirSync(`../sounds/${thing}`).forEach(sound => {
    if (!sound.endsWith('.ogg')) return
    const split = sound.split('-')
    const soundID = split[split.length -1].slice(0, -4)
    out[thing]['base'].push({ id: soundID })
  })
})

fs.writeFileSync('../data/customSounds.json', JSON.stringify(out, null, 2))