const fs = require('fs')

const newTime = Date.now()
const out = []

fs.readdirSync(`./`).forEach(sound => {
  const split = sound.split('-')
  const soundID = split[split.length -1].slice(0, -4)
  out.push({ id: soundID, ts: newTime })
})

fs.writeFileSync('./newSounds.json', JSON.stringify(out, null, 2))