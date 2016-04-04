var app = angular.module('AngularGoogleMap', ['google-maps']);

app.factory('MarkerCreatorService', function () {

    var markerId = 0;

    function create(latitude, longitude) {
        var marker = {
            options: {
                animation: 1,
                labelAnchor: "28 -5",
                labelClass: 'markerlabel'    
            },
            latitude: latitude,
            longitude: longitude,
            id: ++markerId          
        };
        return marker;        
    }

    function invokeSuccessCallback(successCallback, marker) {
        if (typeof successCallback === 'function') {
            successCallback(marker);
        }
    }

    function createByCoords(latitude, longitude, successCallback) {
        var marker = create(latitude, longitude);
        invokeSuccessCallback(successCallback, marker);
    }

    function createByCurrentLocation(successCallback) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                var marker = create(position.coords.latitude, position.coords.longitude);
                invokeSuccessCallback(successCallback, marker);
            });
        } else {
            alert('Unable to locate current position');
        }
    }

    return {
        createByCoords: createByCoords,
        createByCurrentLocation: createByCurrentLocation
    };

});


app.controller('MapCtrl', ['MarkerCreatorService', '$scope','$http', function (MarkerCreatorService, $scope,$http) {

        MarkerCreatorService.createByCoords(39.4858977, -6.370572100000004, function (marker) {
            $scope.autentiaMarker = marker;
            $scope.currentlocation = marker;
        });
        $value = 1500;
        $scope.changevalue = function(){
            $scope.value = $scope.rangevalue*30;
        };
        
        $scope.locationRadius = function (){
            var x = document.getElementById("range").value*30;
            var lista =[];
            var position= { query : "FOR doc IN WITHIN(Caceres, "+$scope.currentlocation.latitude+", "+$scope.currentlocation.longitude+","+x+",'distancia') RETURN doc`", count : true};
            $scope.map.markers=[];
            $scope.map.markers.push($scope.currentlocation);
            $http.post("http://127.0.0.1:8529/_api/cursor",JSON.stringify(position)).then(function(data){
                console.log(data.data.result);
                for (var i = 0; i < data.data.result.length; i++) {
                         MarkerCreatorService.createByCoords(data.data.result[i].latitude, data.data.result[i].longitude, function (marker) {
                            marker.options.labelContent = data.data.result[i].nombre;
                             var objetoListado={
                                nombre:"",
                                distancia:0.0
                            };
                            objetoListado.nombre = data.data.result[i].nombre;
                            objetoListado.distancia = data.data.result[i].distancia.toFixed(2);
                            lista.push(objetoListado);

                            $scope.map.markers.push(marker);
                            
                        });
                };                           
                $scope.listalugares = lista;
                 console.log($scope.listalugares);
            });
        };
        $scope.address = '';
        $scope.map = {
            center: {
                latitude: $scope.autentiaMarker.latitude,
                longitude: $scope.autentiaMarker.longitude
            },
            zoom: 12,
            markers: [],
            events: {
            click: function (map, eventName, originalEventArgs) {
                var e = originalEventArgs[0];
                $scope.currentlocation.latitude = e.latLng.lat();
                $scope.currentlocation.longitude = e.latLng.lng();
                $scope.currentlocation.options.labelContent = 'Estás aquí';
                $scope.map.markers=[];
                $scope.map.markers.push($scope.currentlocation);
                refresh(marker);
                $scope.$apply();
                }
            },
            control: {},
            options: {
                scrollwheel: false
            }
        };


        $scope.addCurrentLocation = function () {
            MarkerCreatorService.createByCurrentLocation(function (marker) {
                marker.options.labelContent = 'Estás aquí';
                $scope.currentlocation = marker;
                $scope.map.markers=[];
                $scope.map.markers.push(marker);
                refresh(marker);
            });
        };
        function refresh(marker) {
            $scope.map.control.refresh({latitude: marker.latitude,
                longitude: marker.longitude});
        }

    }]);


