export function dateFormatter(date) {
  if (!date) return '';
  let day = date.getDate();
  let month = date.getMonth() + 1;
  const year = date.getFullYear();
  if (month < 10) month = `0${month}`;
  if (day < 10) day = `0${day}`;
  return `${year}-${month}-${day}`;
}

export function monthFormatter(date) {
  if (!date) return '';
  let month = date.getMonth() + 1;
  const year = date.getFullYear();
  if (month < 10) month = `0${month}`;
  return `${year}-${month}`;
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
export function distance(lat1, lon1, lat2, lon2, unit) {
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
