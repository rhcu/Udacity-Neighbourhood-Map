// global variables to prevent multiple calls to API
var map, infoWindow;
// Model part with locations data list
// Those are universities of Astana
var locations = data;

function initMap() {
    // responsive for size of browser window
    const mq = window.matchMedia("(max-width: 413px)");
    var zoom_var;

    if (mq.matches) {
        zoom_var = 11;
    } else {
        zoom_var = 13;
    }
    // initialize map centered at Astana
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 51.1605,
            lng: 71.4704
        },
        zoom: zoom_var,
        // Night map style taken from Google Maps APIs Documentation
        styles: [{
                elementType: 'geometry',
                stylers: [{
                    color: '#242f3e'
                }]
            },
            {
                elementType: 'labels.text.stroke',
                stylers: [{
                    color: '#242f3e'
                }]
            },
            {
                elementType: 'labels.text.fill',
                stylers: [{
                    color: '#fbfbfb'
                }]
            },
            {
                featureType: 'administrative.locality',
                elementType: 'labels.text.fill',
                stylers: [{
                    color: '#d59563'
                }]
            },
            {
                featureType: 'poi',
                elementType: 'labels.text.fill',
                stylers: [{
                    color: '#d59563'
                }]
            },
            {
                featureType: 'poi.park',
                elementType: 'geometry',
                stylers: [{
                    color: '#263c3f'
                }]
            },
            {
                featureType: 'poi.park',
                elementType: 'labels.text.fill',
                stylers: [{
                    color: '#6b9a76'
                }]
            },
            {
                featureType: 'road',
                elementType: 'geometry',
                stylers: [{
                    color: '#38414e'
                }]
            },
            {
                featureType: 'road',
                elementType: 'geometry.stroke',
                stylers: [{
                    color: '#212a37'
                }]
            },
            {
                featureType: 'road',
                elementType: 'labels.text.fill',
                stylers: [{
                    color: '#9ca5b3'
                }]
            },
            {
                featureType: 'road.highway',
                elementType: 'geometry',
                stylers: [{
                    color: '#746855'
                }]
            },
            {
                featureType: 'road.highway',
                elementType: 'geometry.stroke',
                stylers: [{
                    color: '#1f2835'
                }]
            },
            {
                featureType: 'road.highway',
                elementType: 'labels.text.fill',
                stylers: [{
                    color: '#f3d19c'
                }]
            },
            {
                featureType: 'transit',
                elementType: 'geometry',
                stylers: [{
                    color: '#2f3948'
                }]
            },
            {
                featureType: 'transit.station',
                elementType: 'labels.text.fill',
                stylers: [{
                    color: '#d59563'
                }]
            },
            {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{
                    color: '#17263c'
                }]
            },
            {
                featureType: 'water',
                elementType: 'labels.text.fill',
                stylers: [{
                    color: '#515c6d'
                }]
            },
            {
                featureType: 'water',
                elementType: 'labels.text.stroke',
                stylers: [{
                    color: '#17263c'
                }]
            }
        ]
    });
}

// Error Handling from Google Maps
function error() {
    alert("The error was occured. Try to reload the page later");
}
// Constractor for University that takes data from model as argument
var University = function(item) {
    this.title = item.title;
    this.located = item.located;
    this.logo = item.logo;
    this.marker = null;
};

// Creates a marker with color property
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(28, 43),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(28, 43));
    return markerImage;
}

// VM part of KnockoutJS MVVM
var ViewModel = function() {

    var self = this;

    // highlights an icon when mouse is over it
    var defaultIcon = makeMarkerIcon('FB6733');
    var highlightedIcon = makeMarkerIcon('FFFF24');

    infoWindow = new google.maps.InfoWindow();
    self.locations_list = [];
    // creates Location objects with data from Model
    locations.forEach(function(item) {
        self.locations_list.push(new University(item));
    });

    var bounds = new google.maps.LatLngBounds();
    // markers on map
    self.locations_list.forEach(function(item) {
        item.marker = new google.maps.Marker({
            map: map,
            position: item.located,
            logo: item.logo,
            icon: defaultIcon
        });

        item.marker.setMap(map);
        bounds.extend(item.marker.position);
        map.fitBounds(bounds);

        // request to Wikipedia API to find articles about universities
        var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' +
            item.title + '&format=json&callback=wikiCallback';
        // There could be several result
        var wikiRes = "";
        // Not to wait too long if server is not responding
        var wikiRequestTimeout = setTimeout(function() {
            wikiRes = "Cannot load articles for " + item.title + ". Try to refresh page";
        }, 2000);
        //AJAX request to Wikipedia
        $.ajax({
            url: wikiUrl,
            dataType: "jsonp",
            success: function(response) {
                var articleList = response[1];
                for (var i = 0; i < articleList.length; i++) {
                    articleStr = articleList[i];
                    var url = 'http://en.wikipedia.org/wiki/' + articleStr;
                    wikiRes += '<li><a href="' + url + '" target="_blank">' +
                        articleStr + '</a></li>';
                }
                clearTimeout(wikiRequestTimeout);
            }
        });
		
        //adds the 'click' event to marker
        google.maps.event.addListener(item.marker, 'click', function() {
            item.marker.setAnimation(google.maps.Animation.DROP);
            infoWindow.open(map, item.marker);
            infoWindow.setContent(item.title + '<br>' + '<p>Latitude: ' + item.located.lat +
                '<br>' + '<p>Longitude: ' + item.located.lng +
                '<br> <p style="text-align:center"><img src="' +
                item.logo + '" width="100"></p><br><p>Wikipedia articles about this place: </p>' + wikiRes);
        });

        //adds the 'mouseoover' & 'mouseout' event to marker
        google.maps.event.addListener(item.marker, 'mouseover', function() {
            item.marker.setIcon(highlightedIcon);
        });
        google.maps.event.addListener(item.marker, 'mouseout', function() {
            item.marker.setIcon(defaultIcon);
        });
    });

    // Shows clicked item from the list on the map
    self.clicked = function(clicked_item) {
        self.locations_list.forEach(function(item) {
            if (clicked_item.title != item.title) {
                item.marker.setVisible(false);
            } else {
                item.marker.setVisible(true);
                item.marker.setMap(map);
                item.marker.setAnimation(google.maps.Animation.DROP);
                bounds.extend(item.marker.position);
                infoWindow.open(map, item.marker);

                var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' +
                    item.title + '&format=json&callback=wikiCallback';

                var wikiRes = "";

                var wikiRequestTimeout = setTimeout(function() {
                    wikiRes = "Cannot load articles for " + item.title + ". Try to refresh page";
                }, 2000);

                $.ajax({
                    url: wikiUrl,
                    dataType: "jsonp",
                    success: function(response) {
                        var articleList = response[1];
                        for (var i = 0; i < articleList.length; i++) {
                            articleStr = articleList[i];
                            var url = 'http://en.wikipedia.org/wiki/' + articleStr;
                            wikiRes += '<li><a href="' + url + '" target="_blank">' +
                                articleStr + '</a></li>';
                        }
						infoWindow.setContent(item.title + '<br>' + '<p>Latitude: ' + item.located.lat +
                                '<br>' + '<p>Longitude: ' + item.located.lng +
                                '<br> <p style="text-align:center"><img src="' +
                                item.logo + '" width="100"></p><br><p>Wikipedia articles about this place: </p>' + wikiRes);
                        clearTimeout(wikiRequestTimeout);
                        
                    }
                });
            }
        });
    };


    // Hides markers when button 'Hide' is pressed
    // They are shown initially by default
    self.hideListings = function() {
        self.locations_list.forEach(function(item) {
            item.marker.setMap(null);
        });
    };

    // Displays markers on the map when 'Show' is pressed
    self.showListings = function() {
        var bounds = new google.maps.LatLngBounds();
        self.locations_list.forEach(function(item) {
            infoWindow.close();
            item.marker.setVisible(true);
            item.marker.setMap(map);
            bounds.extend(item.marker.position);
        });
        map.fitBounds(bounds);
    };


    // searches for universities by its title
    self.search_result = ko.observableArray();
    self.searchInput = ko.observable('');

    // button that cleares entered text
    self.clearForm = function() {
        self.searchInput('');
    };
    // adds all locations to the list to display
    self.locations_list.forEach(function(item) {
        self.search_result.push(item);
    });


    // search function that sets only marker of satisfying element to visible
    // searches occurence of chars from input in the title of item
    self.search = function() {
        self.hideListings();
        // takes the value from observable
        var searchItem = self.searchInput();
        // clears the previous search result 
        self.search_result.removeAll();
        // adds if a match
        self.locations_list.forEach(function(item) {
            if (item.title.toUpperCase().indexOf(searchItem.toUpperCase()) !== -1) {
                self.search_result.push(item);
                item.marker.setVisible(true);
                // extends bounds to fit found markers
                item.marker.setMap(map);
                bounds.extend(item.marker.position);
                // calls the infoWindow
                infoWindow.open(map, item.marker);
                infoWindow.setContent(item.title + '<p> Click on the marker to find out more </p>');
            }
        });
    };
};

// Google Maps API Server returns a callback to initApp
// as an answer to the request 

function initApp() {
    //initMap is called to initialize a map
    initMap();

    // KnockoutJS binding is applied
    viewModel = new ViewModel();
    ko.applyBindings(viewModel);
}