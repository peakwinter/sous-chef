/* eslint-env browser, jquery */

import L from 'leaflet';

const TILE_URL = 'https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png';


export default {
  init() {
    let mymap;

    // Add map
    if ($('#mapid').length > 0) {
      // eslint-disable-next-line new-cap
      mymap = new L.map('mapid').setView([45.516564, -73.575145], 18);
      // create a new tile layer wiyh bike path
      // (http://thunderforest.com/maps/opencyclemap/)
      const layer = new L.TileLayer(TILE_URL, {maxZoom: 18});

      // add the layer to the map and center it on santropol
      mymap.addLayer(layer);
      mymap.setView(new L.LatLng(45.516564, -73.575145), 13);
    }

    return mymap;
  },
};
