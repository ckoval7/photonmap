function loadSplatKml(url) {
  kmlsrc = new Cesium.KmlDataSource();
  kmlsrc.load(url);
  kmlsrc.entities.values[0].rectangle.material.color = new Cesium.Color(1, 1, 1, 0.25);
  return(kmlsrc);
}
