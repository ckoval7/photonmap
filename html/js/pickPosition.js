var scene = viewer.scene;
if (!scene.pickPositionSupported) {
  window.alert("This browser does not support pickPosition.");
}

var handler;
var cartesian;
var cartographic
var center_lat;
var center_lon;

// ***********************************************
// Disable/enable object selection as needed.
//************************************************
var noSelect = false;
var defaultClickHandler = viewer.screenSpaceEventHandler.getInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
var myClickFunction = function(event) {
  if (!noSelect) {
    defaultClickHandler(event);
  } else {
    viewer.selectedEntity = undefined;
    viewer.trackedEntity = undefined;
  }
};
viewer.screenSpaceEventHandler.setInputAction(myClickFunction, Cesium.ScreenSpaceEventType.LEFT_CLICK);


// Pick the center point of a circle
function pickCenter(lat_element_id, lon_element_id, radius_element_id, outlineColor) {
  noSelect = true;
  var entity = viewer.entities.add({
    label: {
      show: false,
      showBackground: true,
      font: "14px monospace",
      horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(15, 0),
    },
  });
  handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
  // Mouse over the globe to see the cartographic position
  handler.setInputAction(function (movement) {
    cartesian = viewer.camera.pickEllipsoid(
      movement.endPosition,
      scene.globe.ellipsoid
    );
    cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    if (cartesian) {
      var center_lon = Cesium.Math.toDegrees(
        cartographic.longitude
      ).toFixed(5);
      var center_lat = Cesium.Math.toDegrees(
        cartographic.latitude
      ).toFixed(5);

      lat_element_id.value = center_lat;
      lon_element_id.value = center_lon;
      entity.position = cartesian;
      entity.label.show = true;
      entity.label.text =
        "Lat: " +
        ("   " + center_lat).slice(-10) +
        "\nLon: " +
        ("   " + center_lon).slice(-10);
    } else {
      entity.label.show = false;
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

  handler.setInputAction(function () {
    clearHover();
    pickRadius(radius_element_id, cartographic, outlineColor);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}
