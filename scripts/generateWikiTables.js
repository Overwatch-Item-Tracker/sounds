const fs = require('fs')
const _ = require('lodash')

const data = require('../data/mappedSounds.json')

Object.keys(data).forEach(hero => {
  var secondsColumnIDs = Object.keys(data[hero])
  var firstColumnIDs = secondsColumnIDs.splice(0, Math.ceil(secondsColumnIDs.length / 2))
  var ids = _.zip(firstColumnIDs, secondsColumnIDs)
  var table = ids.map(idSet => {
    let name = data[hero][idSet[0]] || ''
    let name2 = data[hero][idSet[1]] || ''
    return `{{DataRow|${idSet[0]}|${name}|${idSet[1] || ''}|${name2}}}\n`
  })
  fs.writeFileSync(`../tables/${hero}.txt`, `{{VoiceDataTable|\n${table.join('')}}}`)
})