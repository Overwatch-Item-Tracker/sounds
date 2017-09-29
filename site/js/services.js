OWI.factory('DataService', ["$http", "$q", function($http, $q) { //eslint-disable-line
  const baseUrl = 'https://js41637.github.io/Overwatch-Item-Tracker/data'
  const service = {
    initialized: false,
    data: {},
    heroes: [],
    waitForInitialization: () => {
      return $q(function(resolve) {
        function waitForInitialize() {
          if (service.initialized) {
            resolve(service.data);
          } else {
            setTimeout(waitForInitialize, 30);
          }
        }
        waitForInitialize();
      });
    },
    getSoundData: () => {
      return $http.get('./data/soundFiles.json').then(resp => {
        if (resp.status == 200) {
          const heroes = Object.keys(resp.data)
          return { heroes, hero: heroes[0], sounds: resp.data }
        } else {
          console.error("Failed loading soundFiles.json ???", resp.status, resp.error);
          Promise.reject("Failed loading soundFiles.json ???")
        }
      }, function(resp) {
        console.error("Failed loading soundFiles.json ???", resp.status, resp.error);
        Promise.reject("Failed loading soundFiles.json ???")
      })
    },
    getItemsAndMappedData: () => {
      return Promise.all(['items', 'mappedVoicelines', 'mappedSounds', 'customSounds', '03F'].map((what, i) => {
        var url = !i ? `${baseUrl}/${what}` : `./data/${what}`
        return $http.get(`${url}.json`).then(resp => {
          if (resp.status == 200) {
            return resp.data
          } else {
            console.error(`Failed loading ${what}.json`, resp.status, resp.error);
            if (what === '03F') return undefined
            Promise.reject(`Failed loading ${what}.json`)
          }
        }, function(resp) {
          console.error(`Failed loading ${what}.json`, resp.status, resp.error);
          Promise.reject(`Failed loading ${what}.json`)
        })
      }))
    },
    init: () => {
      Promise.all([service.getSoundData(), service.getItemsAndMappedData()]).then(([soundData, [items, mappedVoicelines, mappedSounds, customSounds, O3F]]) => {
        console.log('Loaded data')     
        Object.assign(soundData.sounds, customSounds, O3F ? { "03F": O3F } : {})
        Object.assign(service.data, {
          mappedVoicelines,
          items,
          mappedSounds
        }, soundData)
        service.heroes = [...soundData.heroes]
        service.data.heroes = soundData.heroes.concat(Object.keys(customSounds))
        if (O3F) service.data.heroes.push('03F')
        service.initialized = true
      })
    }
  }
  service.init()
  return service
}])