/* eslint-env browser, jquery */
/* global L */
/* global Mustache */
/* global Sortable */

// Javascript of the delivery application
// ****************************************

let control;  // global bind

// eslint-disable-next-line max-len
const MAPBOX_API_KEY = 'pk.eyJ1IjoicmphY3F1ZW1pbiIsImEiOiJjaXAxaWpxdGkwMm5ydGhtNG84eGdjbGthIn0.TdwCw6vhAJdgxzH0JBp6iA';
const TILE_URL = 'https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png';

// eslint-disable-next-line no-unused-vars
function printMapAndItinerary() {
  const panePosition = $('.leaflet-map-pane').position();
  const mapImgs = [];
  $('img.leaflet-tile.leaflet-tile-loaded').each((i, elem) => {
    const position = $(elem).position();
    mapImgs.push({
      top: position.top,
      left: position.left,
      src: elem.src,
    });
  });

  const routes = [];
  $('.leaflet-routing-geocoder').each((i, elem) => {
    routes.push({
      client_order: $(elem).find('> .geocoder-handle').text(),
      client_name: $(elem).find('> input').val(),
    });
  });
  const waypoints = control.getWaypoints();
  $.each(waypoints, (i, waypoint) => {
    routes[i].client_address = waypoint.options.address;
  });
  $('.leaflet-marker-pane > div').each((i, elem) => {
    routes[i].marker_html = elem.outerHTML;
  });

  const directions =
    $('.leaflet-routing-alt:not(.leaflet-routing-alt-minimized)');

  const templateVars = {
    map_height: $('#main').height(),
    map_width: $('#main').width(),
    pane_left: panePosition.left,
    pane_top: panePosition.top,
    map_imgs: mapImgs,
    map_route_svg: $('svg.leaflet-zoom-animated')[0].outerHTML,
    distance_and_time: directions.find('> h3').text(),
    routes,
  };

  const w = window.open('');
  w.document.open();
  w.document.write(Mustache.render($('#print-template').html(), templateVars));
  w.document.close();
}

function getRouteWaypoints(routeId) {
  const waypoints = [];
  // Reset current waypoints
  control.setWaypoints(waypoints);

  // Ajax call to get waypoint according route
  const wpUrl =
    `../getDailyOrders/?route=${routeId}&mode=euclidean` +
    '&if_exist_then_retrieve=true';
  $.get(wpUrl, (data) => {
    const DeliveryPoints = L.Routing.Waypoint.extend({member: '', address: ''});
    const groupedWaypoints = groupWaypoints(data.waypoints);

    // create an array of waypoint from ajax call
    Object.keys(groupedWaypoints).forEach((k, i) => {
      const currentWaypoint = groupedWaypoints[k][0];
      const memberString = groupedWaypoints[k].map(x => x.member).join(', ');
      waypoints.push(new DeliveryPoints(
        L.latLng(currentWaypoint.latitude, currentWaypoint.longitude),
      ));
      waypoints[i].options.multipleClients = groupedWaypoints[k].length !== 1;
      waypoints[i].options.address = currentWaypoint.address;
      waypoints[i].options.member = memberString;
      waypoints[i].options.id = currentWaypoint.id;
      waypoints[i].name = memberString;
    });

    // Add first waypoint for santropol
    const santroStart = new DeliveryPoints(L.latLng(45.516564, -73.575145));
    santroStart.santro = true;
    santroStart.name = 'Santropol Roulant';
    santroStart.options.address = '111 rue Roy Est';
    waypoints.splice(0, 0, santroStart);

    // Add return waypoint to go back to santropol
    const santroReturn = new DeliveryPoints(L.latLng(45.516564, -73.575145));
    santroReturn.santro = true;
    santroReturn.hideMarker = true;
    santroReturn.name = 'Santropol Roulant';
    santroReturn.options.address = '111 rue Roy Est';
    waypoints.push(santroReturn);

    // Set waypoints on the map
    control.setWaypoints(waypoints);
  });
}

function groupWaypoints(waypoints) {
  // Parse waypoints. If they are within 5 decimal places of tolerance with
  // another waypoint on the list, we can safely assume they are at the same
  // address. In this case, we show one special marker with the number of the
  // coexisting waypoints on it.

  const groupedWaypoints = waypoints.reduce((rv, x) => {
    let lat = x.latitude.split('.');
    lat[1] = lat[1].slice(0, 5);
    lat = lat.join('.');

    let lng = x.longitude.split('.');
    lng[1] = lng[1].slice(0, 5);
    lng = lng.join('.');

    const val = `${lat}, ${lng}`;
    // eslint-disable-next-line no-param-reassign
    (rv[val] = rv[val] || []).push(x);
    return rv;
  }, {});

  return groupedWaypoints;
}

// eslint-disable-next-line no-unused-vars
function mainMapInit(map) {
  // create a new tile layer wiyh bike path
  // (http://thunderforest.com/maps/opencyclemap/)
  const layer = new L.TileLayer(TILE_URL, {maxZoom: 18});

  // add the layer to the map and center it on santropol
  map.addLayer(layer);
  map.setView(new L.LatLng(45.516564, -73.575145), 13);

  // Create bike router using mapbox
  const bikerouter = L.Routing.mapbox(MAPBOX_API_KEY);
  const defaultVehicle = $('#route_map').data('selected-vehicle');
  bikerouter.options.profile = `mapbox/${defaultVehicle}`;

  // Extend Routing Plan to add more buttons
  class RoutingPlan extends L.Routing.Plan {
    createGeocoders() {
      const container = super.createGeocoders();

      // Create a button group for different route vehicles
      const div = L.DomUtil.create('div', '', container);
      div.style.padding = '0';
      div.className = 'small ui basic buttons';
      const vehicleButtons = {};
      const vehicles = $('#route_map').data('vehicles');  // already JSON
      $.each(vehicles, (idx, tuple) => {
        const code = tuple[0];
        const displayName = tuple[1];
        const button = L.DomUtil.create('button', '', div);
        button.setAttribute('type', 'button');
        button.className = 'ui button';
        button.innerText = displayName;
        button.style.float = 'left';
        const canSave = $('#route_map').data('can-save');
        if (canSave === 'no') {
          button.setAttribute('disabled', 'disabled');
        }
        vehicleButtons[code] = button;
      });
      $.each(vehicleButtons, (vehicle, btn) => {
        L.DomEvent.on(btn, 'click', () => {
          vehicleButtons[vehicle].classList.add('loading');
          saveVehicle(vehicle, () => {
            // success callback
            vehicleButtons[vehicle].classList.remove('loading');

            // vehicle is one of: cycling, driving, or walking
            control.getRouter().options.profile = `mapbox/${vehicle}`;
            // refresh route display
            control.route();

            $.each(vehicleButtons, (v, b) => {
              b.classList.remove('active');
            });
            vehicleButtons[vehicle].classList.add('active');
          });
        });
      });

      // set default active button
      vehicleButtons[defaultVehicle].classList.add('active');
      return container;
    }
  }

  const plan = new RoutingPlan(
    // Empty waypoints
    [], {
      // Default geocoder
      geocoder: L.Control.Geocoder.nominatim({
        geocodingQueryParams: {countrycodes: 'ca'},
      }),

      // Create routes while dragging markers
      routeWhileDragging: true,

      // Add a button for reversing waypoints
      reverseWaypoints: true,

      createGeocoder: (i, totalWaypoints, newPlan) => {
        const geocoder =
          L.Routing.GeocoderElement.prototype.options.createGeocoder.call(
            newPlan, i, totalWaypoints, newPlan);
        const handle = L.DomUtil.create('div', 'geocoder-handle');
        handle.innerHTML = String.fromCharCode(65 + i);
        geocoder.container.insertBefore(handle, geocoder.container.firstChild);
        return geocoder;
      },

      createMarker: (i, wp) => {
        let marker;

        // adjust marker according waypoints
        if (wp.santro && !wp.hideMarker) {
          // add awesome marker for santropol
          marker = L.marker([45.516564, -73.575145], {
            draggable: false,
            opacity: 1,
            icon: L.AwesomeMarkers.icon({
              icon: 'cutlery',
              prefix: 'fa',
              markerColor: 'red',
              iconColor: '#f28f82',
            }),
          });

          const info = '<div class="ui list">' +
            '<div class="item"><i class="food icon"></i> ' +
            'Santropol Roulant </div></div>';

          marker.bindPopup(info).openPopup();

          return marker;
        } else if (!wp.santro) {
          marker = L.marker(wp.latLng, {
            icon: L.icon.glyph({
              prefix: '',
              glyph: wp.options.multipleClients ?
                `${String.fromCharCode(65 + i)}*` :
                String.fromCharCode(65 + i),
            }),
            draggable: true,
          });

          /* eslint-disable max-len */
          const info = '<div class="ui list">' +
            `<div class="item"><i class="user icon"></i> ${wp.options.member}</div>` +
            `<div class="item"><i class="home icon"></i> ${wp.options.address}</div>` +
            '</div></div>';
          /* eslint-enable max-len */

          marker.bindPopup(info).openPopup();
          return marker;
        }
        return undefined;
      },
    },
  );

  // Extend Routing Control to build sortable geocoder
  class RoutingControl extends L.Routing.Control {
    initialize() {
      super.initialize({
        router: bikerouter,
        language: 'fr',
        showAlternatives: true,
        lineOptions: {
          styles: [
            {color: 'black', opacity: 0.3, weight: 11},
            {color: 'white', opacity: 0.9, weight: 9},
            {color: 'red', opacity: 1, weight: 3},
          ],
        },
        altLineOptions: {
          styles: [
            {color: 'black', opacity: 0.1, weight: 11},
            {color: 'white', opacity: 0.25, weight: 9},
            {color: 'blue', opacity: 0.25, weight: 3},
          ],
        },
        show: false,
        plan,
      });
    }
  }

  // Bind control outside of the map
  control = new RoutingControl();
  const routeBlock = control.onAdd(map);
  $('.controls').append(routeBlock);

  const routeId = $('#route_map').attr('data-route');
  getRouteWaypoints(routeId);

  // Add sortable on the route controler
  Sortable.create(document.querySelector('.leaflet-routing-geocoders'), {
    handle: '.geocoder-handle',
    draggable: '.leaflet-routing-geocoder',
    onUpdate: (e) => {
      const oldI = e.oldIndex;
      const newI = e.newIndex;
      const wps = control.getWaypoints();
      const wp = wps[oldI];

      if (oldI === newI || newI === undefined) {
        return;
      }

      wps.splice(oldI, 1);
      wps.splice(newI, 0, wp);
      control.setWaypoints(wps);

      // Save the route
      saveRoute(control);
    },
  });
}

function saveRoute(ctrl) {
  const wp = ctrl.getWaypoints();
  const data = {route: [], members: []};
  const routeId = $('#route_map').data('route');
  const saveUrl = $('#route_map').data('save-url');
  const canSave = $('#route_map').data('can-save');
  if (canSave === 'no') {
    return;
  }
  data.route.push({id: routeId});
  // simplify waypoint into a list of member id in the map order
  $.each(wp, (key, value) => {
    if (typeof value.options.id !== 'undefined') {
      data.members.push({id: value.options.id});
    }
  });

  // Post simple list of members to server
  $.ajax(saveUrl, {
    data: JSON.stringify(data),
    contentType: 'application/json; charset=utf-8',
    type: 'POST',
    dataType: 'json',
  });
}

function saveVehicle(vehicle, successCallback, errorCallback) {
  const data = {route: [], vehicle: ''};
  const routeId = $('#route_map').data('route');
  const saveVehicleUrl = $('#route_map').data('save-vehicle-url');
  const canSave = $('#route_map').data('can-save');
  if (canSave === 'no') {
    return;
  }
  data.route.push({id: routeId});
  data.vehicle = vehicle;
  // Post simple list of members to server
  $.ajax(saveVehicleUrl, {
    data: JSON.stringify(data),
    contentType: 'application/json; charset=utf-8',
    type: 'POST',
    dataType: 'json',
    success: successCallback,
    error: errorCallback,
  });
}

/* This routine calculates the distance between two points (given the
     latitude/longitude of those points).
   Passed to function:
     lat1, lon1 = Latitude and Longitude of point 1 (in decimal degrees)
     lat2, lon2 = Latitude and Longitude of point 2 (in decimal degrees)
     unit = the unit you desire for results
       where: 'M' is statute miles (default)
              'K' is kilometers
              'N' is nautical miles
*/
function distance(lat1, lon1, lat2, lon2, unit) {
  const radlat1 = (Math.PI * lat1) / 180;
  const radlat2 = (Math.PI * lat2) / 180;
  const theta = lon1 - lon2;
  const radtheta = (Math.PI * theta) / 180;
  let dist = (Math.sin(radlat1) * Math.sin(radlat2)) +
    (Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta));
  dist = Math.acos(dist);
  dist *= 180 / Math.PI;
  dist *= 60 * 1.1515;
  if (unit === 'K') {
    dist *= 1.609344;
  }
  if (unit === 'N') {
    dist *= 0.8684;
  }
  return dist;
}

$(() => {
  let marker;
  let mymap;

  // Add map
  if ($('#mapid').length > 0) {
    // eslint-disable-next-line new-cap
    mymap = new L.map('mapid').setView([45.516564, -73.575145], 18);
    const tileUrl = 'https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png';
    const layer = new L.TileLayer(tileUrl, {maxZoom: 18});
    mymap.addLayer(layer);
  }

  $('#geocodeBtn').click((event) => {
    // Display a loading indicator
    $('form').addClass('loading');
    const notFoundMsg = $(event.currentTarget).data('notFoundMsg');

    // eslint-disable-next-line new-cap
    const geocoder = new L.Control.Geocoder.nominatim({
      geocodingQueryParams: {countrycodes: 'ca'},
    });
    // var yourQuery = "4846 rue cartier, Montreal, Qc";
    const apt = '';
    let street = '';
    let city = '';
    const zipcode = '';

    if ($('.field > .street.name').val()) {
      street = `${$('.field > .street.name').val()}&`;
    }
    if ($('.field > .city').val()) {
      city = `${$('.field > .city').val()}&`;
    }

    const yourQuery = apt + street + city + zipcode;

    geocoder.geocode(yourQuery, (results) => {
      if (results.length > 0) {
        const data = {
          address: results[0].name,
          lat: results[0].center.lat,
          long: results[0].center.lng,
        };

        // calculate distance between santropol and the place found
        const dist = distance(
          45.516564, -73.575145, results[0].center.lat,
          results[0].center.lng, 'K');

        // update text field withe info
        $('.field > .latitude').val(data.lat);
        $('.field > .longitude').val(data.long);
        $('.field .distance').val(dist);

        // Add or update marker for the found address
        if (typeof (marker) === 'undefined') {
          marker = L.marker([data.lat, data.long], {draggable: true});
          marker.addTo(mymap);
          mymap.setView([data.lat, data.long], 17);
        } else {
          marker.setLatLng([data.lat, data.long]);
          mymap.setView([data.lat, data.long], 17);
        }

        // Adjust latitude / longitude if user drag the marker
        marker.on('dragend', (ev) => {
          const chagedPos = ev.target.getLatLng();
          $('.field > .latitude').val(chagedPos.lat);
          $('.field > .longitude').val(chagedPos.lng);
          const newdist = distance(
            45.516564, -73.575145, chagedPos.lat, chagedPos.lng, 'K');
          $('.field > .distance').val(newdist);
        });
      } else {
        // eslint-disable-next-line no-alert
        alert(notFoundMsg);
      }

      // Remove the loading indicator
      $('form').removeClass('loading');
    });
  });
});
