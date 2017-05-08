const fs = require('fs')

const dirs = ['athena', 'hollywood-guy', 'lucioball', 'snowball-offensive', 'uprising', 'junkenstein']

const out = { 'unknown': [] }
dirs.forEach(thing => {
  if (!out[thing]) out[thing] = []
  fs.readdirSync(`./${thing}`).forEach(sound => {
    if (!sound.endsWith('.ogg')) return
    const split = sound.split('-')
    const soundID = split[split.length -1].slice(0, -4)
    out[thing].push({ id: soundID })
  })
})

fs.readdirSync(`./`).forEach(sound => {
  if (!sound.endsWith('.ogg')) return
  const split = sound.split('-')
  const soundID = split[split.length -1].slice(0, -4)
  out['unknown'].push({ id: soundID })
})

fs.writeFileSync('./customSounds.json', JSON.stringify(out))