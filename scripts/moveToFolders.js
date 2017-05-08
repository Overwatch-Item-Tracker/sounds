const fs = require('fs')

const customSounds = JSON.parse(fs.readFileSync('./mappedSounds.json', 'utf8'))

for (let hero in customSounds) {
  customSounds[hero].forEach(sound => {
    fs.renameSync(`./unknown-${sound}.ogg`, `./${hero}/${hero}-${sound}.ogg`)
  })
}