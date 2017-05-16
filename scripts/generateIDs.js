const fs = require('fs')
const sounds = require('../data/soundFiles.json')

const soundIDs = {}

for (let hero in sounds) {
  for (let type in sounds[hero]) {
    for (let sound in sounds[hero][type]) {
      soundIDs[sound] = true
    }
  }
}

fs.writeFileSync('../data/ids.json', JSON.stringify(soundIDs))