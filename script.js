;(function () {
'use strict'

Ink.loadScript = function () { } // no dynamic loading today!

var streetViewSvc = {
    endPoint: 'http://maps.googleapis.com/maps/api/streetview?size=300x300&sensor=false',
    apiKey: 'notsureifshouldshow'
}

var googleMapsDirectionsLink = 'https://maps.google.com/maps?daddr='

var mapCanvas = Ink.i('mapCanvas');
var modalText = Ink.i('modalText');
var streetView = Ink.i('streetView');
var modalLink = document.getElementById('modalLink');
var gmaps = google.maps;
var hadHash

// sets whether the user is visiting a spot or trying to show someone a spot
function setHadHash(hash) {
    hash = ('' + hash).replace(/#/, '')
    document.documentElement.className = document.documentElement.className
        .replace(/(^| )(had-hash|no-had-hash)( |$)/, ' ')  // now I have 2 problems
    document.documentElement.className += hash ? ' had-hash' : ' no-had-hash';
    hadHash = hash
}

setHadHash('' + location.hash)

if (hadHash) {
    initVisitMode();
} else {
    initShareMode();
}

// creating the map
Ink.createModule('aa.map', 1, ['Ink.Dom.Event_1', 'Ink.Dom.Element_1'], function (InkEvent, InkElement) {

    var center = (hadHash ? hadHash : '39.436193,-8.22876');
    var map = window.map = new gmaps.Map(mapCanvas, {
        zoom: 6,
        center: stringToLatLng(center)
    })

    return map;
});

function initShareMode() {
    // creating the marker
    Ink.createModule('aa.marker', 1, ['aa.map_1'], function (map) {
        var marker = window.marker = new google.maps.Marker({
            position: map.getCenter(),
            map: map,
            draggable: !hadHash,
            visible: !!hadHash,
            title: hadHash ? '' : 'clica aqui'
        });

        return marker;
    });
    
    // listening to events, firing the modal
    Ink.requireModules(['aa.marker_1', 'aa.map_1', 'Ink.Dom.Event_1', 'Ink.Dom.Element_1', 'Ink.UI.Modal_1'], function (marker, map, InkEvent, InkElement, Modal) {
        gmaps.event.addListener(map, 'rightclick', onNewMarkerPosition);
        gmaps.event.addListener(marker, 'dragend', onNewMarkerPosition);

        gmaps.event.addListener(marker, 'click', function () {
            var href = latLngToString(marker.getPosition())
            window.location.hash = href
            InkElement.setTextContent(modalLink, window.location + '')
            modalLink.setAttribute('href', window.location  + '')
            
            new Modal(modalText, { height: '350px', width: '800px' })
        })

        function onNewMarkerPosition (ev) {
            if (hadHash) return;
            marker.setPosition(new gmaps.LatLng(ev.latLng.lat(), ev.latLng.lng()))
            marker.setVisible(true)
        }
    });
}

function initVisitMode() {
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({'latLng': stringToLatLng(hadHash)}, function(results, status) {
        var theResult;
        if (status == google.maps.GeocoderStatus.OK) {
            theResult = results[1].formatted_address
        } else {
            theResult = 'Morada desconhecida'
        }
        Ink.createModule('address', 1, [], function () {
            return theResult;
        });
    });

    setTimeout(function () {
        Ink.createModule('address', 1, [], function () {
            return 'Morada Desconhecida'
        })
    }, 2000)

    Ink.requireModules(['Ink.UI.Modal_1', 'Ink.Dom.Element_1', 'address_1'], function (Modal, InkElement, address) {
        streetView.src = streetViewSvc.endPoint + '&location=' + hadHash + '&key=' + streetViewSvc.apiKey
        InkElement.setTextContent(Ink.i('address'), address)
        InkElement.setTextContent(Ink.i('coords'), hadHash.toString().replace(',', ', '))
        Ink.i('directions').href = googleMapsDirectionsLink + hadHash
        new Modal(modalText, {
            onDismiss: function () {
                setHadHash('');
                initShareMode();
                Ink.requireModules(['aa.marker_1'], function (marker) {
                    marker.setVisible(true);
                })
            },
            width: '800px'
        })
    })
}

function round6 (n) {
    return Math.round(n * 100000) / 100000
}

function latLngToString(pos) {
    return '' + round6(pos.lat()) + ',' + round6(pos.lng())
}

function stringToLatLng(s) {
    var splt = s.split(',')
    return new gmaps.LatLng(+splt[0], +splt[1])
}

}());
