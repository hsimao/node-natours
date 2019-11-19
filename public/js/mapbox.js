/* eslint-disable */
const locations = JSON.parse(document.getElementById('map').dataset.locations);

mapboxgl.accessToken =
  'pk.eyJ1IjoiaHNpbWFvIiwiYSI6ImNrMzYwODJtNzBueHQzY3Blb2hodXZsMDkifQ.PEJGnj7qoBvoV68p7wQSxw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/hsimao/ck360c7fw13wa1cmbflkff42r',
  scrollZoom: false
  // center: [-118.35607, 34.140441],
  // zoom: 9
  // interactive: false // 禁止用戶改變 map
});

const bounds = new mapboxgl.LngLatBounds();

// loop 所有座標
locations.forEach(location => {
  // 建立地圖座標 dev
  const el = document.createElement('div');
  el.className = 'marker';

  // 添加地圖座標 dev 到 mapbox marker
  new mapboxgl.Marker({
    element: el,
    anchor: 'bottom'
  })
    .setLngLat(location.coordinates)
    .addTo(map);

  // add popup
  new mapboxgl.Popup({
    offset: 30
  })
    .setLngLat(location.coordinates)
    .setHTML(`<p>Day ${location.day}: ${location.description}</p>`)
    .addTo(map);

  // 擴充地圖可視範圍範圍, 需包含當前位置
  bounds.extend(location.coordinates);
});

// 更新 map 可視範圍
map.fitBounds(bounds, {
  padding: {
    top: 200,
    bottom: 150,
    left: 100,
    right: 100
  }
});
