OWI.controller('MainCtrl', ["$scope", "$location", "DataService", function($scope, $location, DataService) { //eslint-disable-line
  const vm = this;
  const audio = window.audio
  const fileInput = window.fileInput
  const _ = window._

  this.loading = true
  this.looping = false
  this.hero = undefined
  this.selectedItems = {}
  this.mappedSounds = {}
  this.sounds = {}
  this.soundCategory = 'base'
  this.sSound = undefined
  this.sSoundIndex = -1
  this.originalSoundHeroes = []
  this.showNamedSounds = false
  this.isDevMode = location.host.startsWith('localhost')
  this.skin = undefined
  this.moveHeroQuery = null

  this.debugging = false
  this.debugMapping = {}

  this.toggleDevMode = () => this.isDevMode = !this.isDevMode

  let urlShowSkins = $location.search().skins || 'false'
  this.showSkins = urlShowSkins == 'true' ? true : urlShowSkins == 'false' ? false : (() => {
    this.skin = urlShowSkins.length ? urlShowSkins : undefined
    return true
  })()

  DataService.waitForInitialization().then(data => {  
    Object.assign(this, data)
    
    const urlHero = $location.search().hero
    if (urlHero && this.heroes.includes(urlHero)) {
      this.hero = urlHero
    }

    this.importData(this.mappedVoicelines, this.mappedSounds, true)
    vm.loading = false
    setTimeout(() => {
      $scope.$digest()
    }, 1000)
  })

  this.moveToHero = () => {
    if (!this.moveHeroQuery || this.moveHeroQuery.length < 3) return
    if (!this.originalSoundHeroes.includes(this.moveHeroQuery)) return
    if (this.sounds[this.moveHeroQuery][this.soundCategory][this.sSound]) {
      console.log('Sound already exists??', this.sSound)
      return
    }

    console.log(this.moveHeroQuery)
    this.sounds[this.moveHeroQuery][this.soundCategory][this.sSound] = this.sounds[this.hero][this.soundCategory][this.sSound]
    delete this.sounds[this.hero][this.soundCategory][this.sSound]
    this.sortSounds(this.moveHeroQuery, this.soundCategory)
    this.sortSounds(this.hero, this.soundCategory)
    this.selectNextSound(39, this.sSoundIndex - 1)
  }

  this.categoryToggle = (where) => {
    if (this.sounds[this.hero][where]) {
      if (this.sounds[this.hero][where][this.sSound]) {
        console.log('Sound already exists??', this.sSound)
        return
      }

      const index = _.clone(this.sSoundIndex)
      const sound = _.clone(this.sSound)
      this.sounds[this.hero][where][sound] = this.sounds[this.hero][this.soundCategory][sound]
      delete this.sounds[this.hero][this.soundCategory][sound]
      this.sortSounds(this.hero, where)
      this.selectNextSound(39, index - 1)
    }
  }

  this.sortSounds = (hero, where) => {
    console.log(hero, where)
    this.sounds[hero][where] = _.keyBy(_.orderBy(this.sounds[hero][where], ['ts', 'id'], ['desc']), 'id')
  }

  this.selectHero = hero => {
    if (hero == this.hero) return
    this.hero = hero
    $location.search('hero', hero)
    this.soundCategory = 'base'
    this.sSoundIndex = -1
    this.showNamedSounds = false
    if (this.skin) {
      this.showSkins = false
      this.skin = undefined
      $location.search('skins', false)
    }
  }

  // Returns a unique-ish color for a timestamp
  this.getColorForTS = str => {
    if (!str) return ''
    
    function hashCode(str) {
      var hash = 0
      for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
      }
      return hash
    } 

    function intToRGB(i ){
      var c = (i & 0x00FFFFFF).toString(16).toUpperCase()
      return "00000".substring(0, 6 - c.length) + c
    }

    function shadeColor(color, percent) {   
      var f=parseInt(color,16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
      return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
    }
    
    return shadeColor(intToRGB(hashCode(str.toString())), 0.5)
  }

  this.isActualHero = () => {
    if (vm.loading) return false
    return Object.keys(this.items).includes(this.hero)
  }

  this.isHeroDone = hero => {
    if (vm.loading) return false
    if (!this.mappedVoicelines[hero]) return false
    if (Object.keys(this.mappedVoicelines[hero] || {}).length == this.items[hero].items.voicelines.length) return true
    return false    
  }

  this.getVLCount = () => {
    if (vm.loading) return '0/0'
    if (!this.items[this.hero]) return ''
    return Object.keys(this.mappedVoicelines[this.hero] || {}).length + '/' + this.items[this.hero].items.voicelines.length
  }

  this.getMappedSoundsCount = () => {
    if (vm.loading) return
    if (!this.mappedSounds[this.hero]) return
    return Object.keys(this.mappedSounds[this.hero]).length
  }

  this.toggleShowNamedSounds = () => {
    this.showNamedSounds = !this.showNamedSounds
  }

  this.toggleShowSkins = () => {
    this.showSkins = !this.showSkins
    $location.search('skins', this.showSkins)
  }

  this.clearItem = itemID => {
    var soundID = this.selectedItems[itemID]
    delete this.mappedVoicelines[this.hero][soundID]
    delete this.selectedItems[itemID]
  }

  this.selectItem = itemID => {   
    if (this.selectedItems[itemID]) {
      this.playSound(this.selectedItems[itemID], null, true)
      return
    }
    if (!this.sSound) return
    this.mappedVoicelines[this.hero] = this.mappedVoicelines[this.hero] || {}
    if (this.mappedVoicelines[this.hero][this.sSound]) return
    this.mappedVoicelines[this.hero][this.sSound] = itemID
    this.selectedItems[itemID] = this.sSound
  }

  function downloadJSON(data, name) {
    const url = URL.createObjectURL(new Blob([ JSON.stringify(data, null, 2) ],  { type: 'application/json' }))
    const el = document.createElement('a')
    el.setAttribute('href', url)
    el.setAttribute('download', `${name}-${Date.now()}.json`)
    el.click()
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 1000)
  }

  this.saveData = what => {
    var soundFiles
    switch (what) {
      case 'debugMapping':
        downloadJSON(this.debugMapping, 'debugMapping')
        break;
      case 'names':
        downloadJSON(this.mappedSounds, 'mappedSounds')
        break
      case 'voicelines':
        downloadJSON(this.mappedVoicelines, 'mappedVoicelines')
        break
      case 'raw':
        soundFiles = _.reduce(this.sounds, (res, data, key) => {
          if (!this.originalSoundHeroes.includes(key)) return res
          res[key] = data
          return res
        }, {})

        downloadJSON(soundFiles, 'soundFiles')
        break;
      case 'all':
        soundFiles = _.reduce(this.sounds, (res, data, key) => {
          if (!this.originalSoundHeroes.includes(key)) return res
          res[key] = data
          return res
        }, {})

        downloadJSON(this.mappedSounds, 'mappedSounds')
        downloadJSON(this.mappedVoicelines, 'mappedVoicelines')
        downloadJSON(soundFiles, 'soundFiles')
        break;
    }
  }

  this.clearData = () => {
    this.mappedVoicelines = {}
    this.selectedItems = {}
  }

  this.importData = (data, internal) => {
    if (fileInput) {
      fileInput.value = null
    }
    var savedData = internal ? data : undefined
    if (!internal) {
      try {
        savedData = JSON.parse(atob(data.replace('data:;base64,', '')))
      } catch(e) {
        console.log("Error")
        return
      }
    }

    for (let hero in savedData) {
      if (!vm.mappedVoicelines[hero]) vm.mappedVoicelines[hero] = {}
      Object.assign(vm.mappedVoicelines[hero], savedData[hero])
      Object.keys(savedData[hero]).forEach(sound => {
        vm.selectedItems[savedData[hero][sound]] = sound
      })
    }
  }

  this.toggleLoop = () => {
    this.looping = !this.looping
    audio.loop = this.looping
    if (this.looping) this.replaySound()
  }

  this.handleKeyPress = event => {
    const keyCode = event.keyCode.toString()
    if (keyCode.match(/(40|39|38|37)/)) {
      event.preventDefault()
      vm.selectNextSound(keyCode)
      return
    }
  }

  this.getSoundCount = () => {
    if (this.loading) return ''
    const sounds = this.sounds[this.hero][this.soundCategory]
    if (Array.isArray(sounds)) {
      return sounds.length
    } else {
      return Object.keys(sounds).length
    }
  }

  this.addSound = () => {
    this.selectNextSound(40)
  }

  this.getTooltip = sound => {
    if (vm.loading) return ''
    if (this.showNamedSounds) return ''
    let out = []
    if (this.mappedVoicelines[vm.hero] && this.mappedVoicelines[vm.hero][sound.id]) {
      var item = this.items[this.hero].items.voicelines.filter(a => a.id == this.mappedVoicelines[vm.hero][sound.id]) || []
      if (item[0]) out.push(item[0].name)
    }
    if (this.mappedSounds[this.hero] && this.mappedSounds[this.hero][sound.id]) out.push(this.mappedSounds[this.hero][sound.id])
    if (sound.skin) out.push(sound.skin)
    if (sound.unused) out.push('Apparently removed??')
    if (out.filter(Boolean)) {
      return out.join('\n')
    }
  }

  this.getItemName = sound => {
    if (vm.loading) return ''
    if (!this.showNamedSounds ) return ''
    if (!this.mappedSounds[this.hero]) return ''
    return '\n' + this.mappedSounds[this.hero][sound] || ''
  }

  this.isItemSelected = sound => {
    if (vm.loading) return false
    if (!this.mappedVoicelines[this.hero]) return false
    return this.mappedVoicelines[this.hero][sound]
  }

  this.selectNextSound = (keyCode, index) => {
    var num = keyCode == 40 || keyCode == 39 ? 1 : keyCode == 38 || keyCode == 37 ? -1 : undefined
    if (!num) return
    const d = this.getSoundFiles()
    let nextItem
    let newIndex
    if (Array.isArray(d)) {
      let i = vm.sSoundIndex
      newIndex = i + num > d.length - 1 ? 0 : i + num < 0 ? d.length -1 : i + num
      nextItem = newIndex
    } else {
      let k = Object.keys(d)
      let i = index || k.indexOf(vm.sSound)
      
      newIndex = i + num > k.length - 1 ? 0 : i + num < 0 ? k.length -1 : i + num
      nextItem = k[newIndex]
    }
    this.playSound(d[nextItem].id, newIndex)
    
    setTimeout(() => {
      document.querySelector('#soundList div.selected').scrollIntoViewIfNeeded(true)
    }, 10)
  }

  this.replaySound = () => {
    audio.currentTime = 0
    audio.play()
  }

  this.setSoundCategory = what => {
    this.soundCategory = what
  }

  this.getSoundFiles = () => {
    if (vm.loading) return []
    if (this.showSkins) {
      return _.filter(this.sounds[this.hero][this.soundCategory], sound => {
        if (!this.skin) return sound.skin
        else return sound.skin == this.skin      
      })
    }
    return this.sounds[this.hero][this.soundCategory]
  }

  var tempSound
  this.playSound = (soundID, index, noSave) => {
    if (!soundID) return
    if ((soundID == this.sSound && !tempSound) || (noSave && tempSound == soundID)) {
      this.replaySound()
      return
    }
    if (noSave) tempSound = soundID
    else {
      tempSound = null
      this.sSound = soundID
      this.sSoundIndex = index
    }
    let hero = this.hero === '03F' ? '' : `${this.hero}-`
    this.currentURL = `./sounds/${this.hero}/${hero}${soundID}.ogg`
  }

  // Show an alert on reloading when in dev mode so you don't loose changes
  window.onbeforeunload = () => {
    if (this.isDevMode) return 'Are you sure??'
    return undefined
  }
}])