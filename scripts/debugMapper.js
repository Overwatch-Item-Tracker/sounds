const _ = require('lodash')
const fs = require('fs')
const debugData = require('../data/debugMapping')
const soundFiles = require('../data/soundFiles')

const badHeroesRx = /^(athena|junkenstein|the-queen)$/

for (let key of _.keys(debugData)) {
  const hero = debugData[key].hero

  if (badHeroesRx.test(hero) || !soundFiles[hero]) continue
  if (!soundFiles[hero]['base']) continue

  if (soundFiles[hero]['base'][key]) {
    console.warn('Sound already exists?', hero, key)
    continue
  }

  soundFiles[hero]['base'][key] = {
    id: key,
    ts: 1507697129319
  }
  soundFiles[hero]['base'] = _.keyBy(_.orderBy(soundFiles[hero]['base'], ['ts', 'id'], ['desc']), 'id')
}

fs.writeFileSync('../data/soundFiles.json', JSON.stringify(soundFiles, null, 2))

