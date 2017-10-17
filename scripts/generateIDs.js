const fs = require('fs')
const sounds = require('../data/soundFiles.json')
const moreSounds = require('../data/customSounds.json')
const evenMoreSounds = require('../data/03F.json')

const outputEvenMoreSounds = false
const badRx = /(01B|dupes)$/

const soundIDs = {}

for (let hero in sounds) {
	if (hero.match(badRx)) continue
  for (let type in sounds[hero]) {
    for (let sound in sounds[hero][type]) {
      soundIDs[sound] = true
    }
  }
}

for (let hero in moreSounds) {
  if (hero.match(badRx)) continue
  for (let type in moreSounds[hero]) {
    for (let sound of moreSounds[hero][type]) {
      soundIDs[sound.id] = true
    }
  }
}

if (outputEvenMoreSounds) {
	for (let type in evenMoreSounds) {
		for (let sound of evenMoreSounds[type]) {
			soundIDs[sound.id] = true
		}
	}
}

fs.writeFileSync('../data/ids.json', JSON.stringify(soundIDs))