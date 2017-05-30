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
