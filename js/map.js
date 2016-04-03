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

    function createByAddress(address, successCallback) {
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({'address' : address}, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                var firstAddress = results[0];
                var latitude = firstAddress.geometry.location.lat();
                var longitude = firstAddress.geometry.location.lng();
                var marker = create(latitude, longitude);
                invokeSuccessCallback(successCallback, marker);
            } else {
                alert("Unknown address: " + address);
            }
        });
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
        createByAddress: createByAddress,
        createByCurrentLocation: createByCurrentLocation
    };

});


app.controller('MapCtrl', ['MarkerCreatorService', '$scope','$http', function (MarkerCreatorService, $scope,$http) {

        MarkerCreatorService.createByCoords(39.4858977, -6.370572100000004, function (marker) {
            marker.options.labelContent = 'Mi ubicación';
            $scope.autentiaMarker = marker;
        });

            $scope.locationRadius = function (){
                console.log("entraaaaaa");
            var x = document.getElementById("range").value*3;
            var lista =[];
            var position= { query : "FOR doc IN WITHIN(Caceres, 39.469591, -6.381758,"+x+") RETURN doc`", count : true};
            console.log("consulta");
            console.log(JSON.stringify(position));
                 $http.post("http://127.0.0.1:8529/_api/cursor",JSON.stringify(position)).then(function(data){
                        console.log(data.data.result);
                        for (var i = 0; i < data.data.result.length; i++) {
                                 MarkerCreatorService.createByCoords(data.data.result[i].latitude, data.data.result[i].longitude, function (marker) {
                                    marker.options.labelContent = data.data.result[i].nombre;
                                    lista.push(data.data.result[i].nombre);

                                    $scope.map.markers.push(marker);
                                    
                                });
                            
                            
                        };
                        console.log("la lista");    
                                   
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
            control: {},
            options: {
                scrollwheel: false
            }
        };

        $scope.map.markers.push($scope.autentiaMarker);

        $scope.addCurrentLocation = function () {
            MarkerCreatorService.createByCurrentLocation(function (marker) {
                marker.options.labelContent = 'You´re here';
                $scope.map.markers.push(marker);
                refresh(marker);
            });
        };
        
        $scope.addAddress = function() {
            var address = $scope.address;
            if (address !== '') {
                MarkerCreatorService.createByAddress(address, function(marker) {
                    $scope.map.markers.push(marker);
                    refresh(marker);
                });
            }
        };

        function refresh(marker) {
            $scope.map.control.refresh({latitude: marker.latitude,
                longitude: marker.longitude});
        }

    }]);


