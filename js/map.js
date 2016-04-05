var app = angular.module('AngularGoogleMap', ['google-maps']);

app.factory('MarkerCreatorService', function () {

    var markerId = 0;

    function create(latitude, longitude, title) {
        var marker = {
            options: {
                animation: 4,
                labelAnchor: "28 -5",
                labelContent: title,
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

    function createByCoords(latitude, longitude, title, successCallback) {
        var marker = create(latitude, longitude, title);
        invokeSuccessCallback(successCallback, marker);
    }

    function createByCurrentLocation(successCallback) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                var marker = create(position.coords.latitude, position.coords.longitude, "Estas aquí");
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
        $scope.value = 1500;

        MarkerCreatorService.createByCoords(39.4858977, -6.370572100000004, "Estás aquí", function (marker) {
            $scope.currentlocation = marker;
        });

        $scope.changevalue = function(){
            $scope.value = $scope.rangevalue*30;
        };

        $scope.locationRadius = function (){
            var radius = document.getElementById("range").value*30;
            var position= { query : "FOR doc IN WITHIN(Caceres, "+$scope.currentlocation.latitude+", "+$scope.currentlocation.longitude+","+radius+",'distancia') RETURN doc", count : true};
            $scope.listalugares =[];
            $scope.map.markers=[];
            $scope.map.markers.push($scope.currentlocation);
            $http.post("http://127.0.0.1:8529/_api/cursor",JSON.stringify(position)).then(function(data){
                for (var i = 0; i < data.data.result.length; i++) {
                    MarkerCreatorService.createByCoords(data.data.result[i].lat, data.data.result[i].lon, data.data.result[i].nombre, function (marker) {
                        $scope.map.markers.push(marker);

                        var objetoListado={
                            nombre:"",
                            distancia:0.0
                        };
                        objetoListado.nombre = data.data.result[i].nombre;
                        objetoListado.distancia = data.data.result[i].distancia.toFixed(2);
                        $scope.listalugares.push(objetoListado);
                    });
                };
            });
        };
        $scope.address = '';
        $scope.map = {
            center: {
                latitude: $scope.currentlocation.latitude,
                longitude: $scope.currentlocation.longitude
            },
            zoom: 12,
            markers: [],
            events: {
            click: function (map, eventName, originalEventArgs) {
                var e = originalEventArgs[0];
                MarkerCreatorService.createByCoords(e.latLng.lat(), e.latLng.lng(), 'Estás aquí', function (marker) {
                        $scope.currentlocation = marker;
                        $scope.map.markers=[];
                        $scope.map.markers.push(marker);
                        refresh(marker);
                        $scope.$apply();
                    });
                }
            },
            control: {},
            options: {
                scrollwheel: false
            }
        };


        $scope.addCurrentLocation = function () {
            MarkerCreatorService.createByCurrentLocation(function (marker) {
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


