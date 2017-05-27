var OWI = angular.module('OWI', ['ui.bootstrap']) // eslint-disable-line

// Setup some angular config stuff
OWI.config(['$compileProvider', '$locationProvider', function($compileProvider, $locationProvider) {
  $compileProvider.debugInfoEnabled(false); // more perf
  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false,
    rewriteLinks: true
  })
  $locationProvider.hashPrefix('')
}])

OWI.directive("fileread", [function () {
  return {
    scope: {
      fileread: "="
    },
    link: function (scope, element) {
      element.bind("change", function (changeEvent) {
        var reader = new FileReader()
        reader.onload = function (loadEvent) {
          scope.$apply(function () {
            scope.fileread(loadEvent.target.result)
          })
        }
        reader.readAsDataURL(changeEvent.target.files[0])
      })
    }
  }
}])

OWI.controller('MainCtrl', ["$http", "$scope", "$location", function($http, $scope, $location) {
  const vm = this;
  const audio = window.audio
  const download = window.download
  const fileInput = window.fileInput
  const _ = window._
  const baseUrl = 'https://js41637.github.io/Overwatch-Item-Tracker/data'

  var loading = true
  this.looping = false
  this.hero = undefined
  this.sounds = {}
  this.items = {}
  this.heroes = []
  this.mappedVoicelines = {}
  this.mappedSounds = {}
  this.selectedItems = {}
  this.soundCategory = 'base'
  this.sSound = undefined
  this.sSoundIndex = -1
  this.showNamedSounds = false
  this.noSounds = false

  this.showSkins = $location.search().skins === 'true'
  this.isDevMode = location.host.startsWith('localhost')

  const getSoundData = () => {
    return $http.get('./data/soundFiles.json').then(resp => {
      if (resp.status == 200) {
        var heroes = Object.keys(resp.data)
        return { heroes, hero: heroes[0], sounds: resp.data }
      } else {
        console.error("Failed loading soundFiles.json ???", resp.status, resp.error);
        Promise.reject("Failed loading soundFiles.json ???")
      }
    }, function(resp) {
      console.error("Failed loading soundFiles.json ???", resp.status, resp.error);
      Promise.reject("Failed loading soundFiles.json ???")
    })
  }

  const getItemsAndMappedData = () => {
    return Promise.all(['items', 'mappedVoicelines', 'mappedSounds', 'customSounds'].map((what, i) => {
      var url = !i ? `${baseUrl}/${what}` : `./data/${what}`
      return $http.get(`${url}.json`).then(resp => {
        if (resp.status == 200) {
          return resp.data
        } else {
          console.error("Failed loading items.json and/or mappedSounds.json ???", resp.status, resp.error);
          Promise.reject("Failed loading items.json and/or mappedSounds.json ???")
        }
      }, function(resp) {
        console.error("Failed loading items.json and/or mappedSounds.json ???", resp.status, resp.error);
        Promise.reject("Failed loading items.json and/or mappedSounds.json ???")
      })
    }))
  }

  const init = () => {
    Promise.all([getSoundData(), getItemsAndMappedData()]).then(([soundData, [items, mappedVoicelines, mappedSounds, customSounds]]) => {
      console.log('Loaded data')
      soundData.heroes = soundData.heroes.concat(Object.keys(customSounds))
      Object.assign(soundData.sounds, customSounds)
      Object.assign(vm, {
        items,
        mappedSounds
      }, soundData)
      vm.importData(mappedVoicelines, mappedSounds, true)
      var urlHero = $location.search().hero
      if (urlHero && vm.heroes.includes(urlHero)) {
        vm.hero = urlHero
      }
      loading = false;
      $scope.$digest()
    })
  }

  this.selectHero = hero => {
    this.hero = hero
    $location.search('hero', hero)
    this.soundCategory = 'base'
    this.sSoundIndex = -1
    this.showNamedSounds = false
  }

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

  this.getColorForTS = str => {
    if (!str) return ''
    return shadeColor(intToRGB(hashCode(str.toString())), 0.5)
  }

  this.isHeroDone = hero => {
    if (loading) return false
    if (!this.mappedVoicelines[hero]) return false
    if (Object.keys(this.mappedVoicelines[hero] || {}).length == this.items[hero].items.voicelines.length) return true
    return false    
  }

  this.getVLCount = () => {
    if (loading) return '0/0'
    if (!this.items[this.hero]) return ''
    return Object.keys(this.mappedVoicelines[this.hero] || {}).length + '/' + this.items[this.hero].items.voicelines.length
  }

  this.getMappedSoundsCount = () => {
    if (loading) return
    if (!this.mappedSounds[this.hero]) return
    return Object.keys(this.mappedSounds[this.hero]).length
  }

  this.toggleShowNamedSounds = () => {
    this.showNamedSounds = !this.showNamedSounds
  }

  this.toggleShowSkins = () => {
    this.showSkins = !this.showSkins
    $location.search('skins', this.showSkins.toString())
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

  this.saveData = () => {
    download(JSON.stringify(this.mappedSounds, null, 2), `mappedSounds-${Date.now()}.json`, 'application/json');
    download(JSON.stringify(this.mappedVoicelines, null, 2), `mappedVoicelines-${Date.now()}.json`, 'application/json');
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

    Object.keys(savedData).forEach(hero => {
      if (!vm.mappedVoicelines[hero]) vm.mappedVoicelines[hero] = {}
      Object.assign(vm.mappedVoicelines[hero], savedData[hero])
      Object.keys(savedData[hero]).forEach(sound => {
        vm.selectedItems[savedData[hero][sound]] = sound
      })
    })
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

  this.getTotalSounds = () => {

  }

  this.addSound = () => {
    this.selectNextSound(40)
  }

  this.getTooltip = sound => {
    if (loading) return ''
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
    if (loading) return ''
    if (!this.showNamedSounds ) return ''
    if (!this.mappedSounds[this.hero]) return ''
    return '\n' + this.mappedSounds[this.hero][sound] || ''
  }

  this.isItemSelected = sound => {
    if (loading) return false
    if (!this.mappedVoicelines[this.hero]) return false
    return this.mappedVoicelines[this.hero][sound]
  }

  this.selectNextSound = (keyCode, index) => {
    var num = keyCode == 40 || keyCode == 39 ? 1 : keyCode == 38 || keyCode == 37 ? -1 : undefined
    if (!num) return
    const d = this.getSoundFiles()
    let nextItem
    if (Array.isArray(d)) {
      let i = vm.sSoundIndex
      nextItem = i + num > d.length - 1 ? 0 : i + num < 0 ? d.length -1 : i + num
    } else {
      let k = Object.keys(d)
      let i = index || k.indexOf(vm.sSound)
      nextItem = k[i + num > k.length - 1 ? 0 : i + num < 0 ? k.length -1 : i + num]
    }
    this.playSound(d[nextItem].id, nextItem)
    
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
    if (loading) return []
    if (this.showSkins) {
      return _.filter(this.sounds[this.hero][this.soundCategory], sound => {
        return sound.skin
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

  window.onbeforeunload = () => {
    return 'Are you sure??'
  }

  init()
}])