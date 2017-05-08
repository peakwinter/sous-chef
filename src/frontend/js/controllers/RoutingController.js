/* eslint-env browser */

import $ from 'jquery';
import L from 'leaflet';
import Mustache from 'mustache';
import Sortable from 'sortablejs';

import MapComponent from '../components/MapComponent';

let control;  // global bind
let defaultVehicle;

// eslint-disable-next-line max-len
const MAPBOX_API_KEY = 'pk.eyJ1IjoicmphY3F1ZW1pbiIsImEiOiJjaXAxaWpxdGkwMm5ydGhtNG84eGdjbGthIn0.TdwCw6vhAJdgxzH0JBp6iA';


// Parse waypoints. If they are within 5 decimal places of tolerance with
// another waypoint on the list, we can safely assume they are at the same
// address. In this case, we show one special marker with the number of the
// coexisting waypoints on it.
function groupWaypoints(waypoints) {
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
        this.saveVehicle(vehicle, () => {
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

  static saveVehicle(vehicle, successCallback, errorCallback) {
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
}


export default {
  init() {
    // Add map
    const mymap = MapComponent.init();
    this.mainMapInit(mymap);
  },

  mainMapInit(map) {
    // Create bike router using mapbox
    const bikerouter = L.Routing.mapbox(MAPBOX_API_KEY);
    defaultVehicle = $('#route_map').data('selected-vehicle');
    bikerouter.options.profile = `mapbox/${defaultVehicle}`;

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
          geocoder.container.insertBefore(
              handle, geocoder.container.firstChild);
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
    this.getRouteWaypoints(routeId);

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
        this.saveRoute(control);
      },
    });
  },

  getRouteWaypoints(routeId) {
    const waypoints = [];
    // Reset current waypoints
    control.setWaypoints(waypoints);

    // Ajax call to get waypoint according route
    const wpUrl =
      `../getDailyOrders/?route=${routeId}&mode=euclidean` +
      '&if_exist_then_retrieve=true';
    $.get(wpUrl, (data) => {
      const DeliveryPoints = L.Routing.Waypoint.extend({
        member: '', address: ''});
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
  },

  printMapAndItinerary() {
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
      map_height: $('#mapid').height(),
      map_width: $('#mapid').width(),
      pane_left: panePosition.left,
      pane_top: panePosition.top,
      map_imgs: mapImgs,
      map_route_svg: $('svg.leaflet-zoom-animated')[0].outerHTML,
      distance_and_time: directions.find('> h3').text(),
      routes,
    };

    const w = window.open('');
    w.document.open();
    w.document.write(
        Mustache.render($('#print-template').html(), templateVars));
    w.document.close();
  },

  saveRoute(ctrl) {
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
  },
};
