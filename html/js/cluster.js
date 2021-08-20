dataSourcePromise.then(function (dataSource) {
  var pixelRange = 15;
  var minimumClusterSize = 3;
  var enabled = true;

  dataSource.clustering.enabled = enabled;
  dataSource.clustering.pixelRange = pixelRange;
  dataSource.clustering.minimumClusterSize = minimumClusterSize;

  var removeListener;

  var pinBuilder = new Cesium.PinBuilder();
  var pin50 = pinBuilder
    .fromText("50+", Cesium.Color.RED, 48)
    .toDataURL();
  var pin40 = pinBuilder
    .fromText("40+", Cesium.Color.ORANGE, 48)
    .toDataURL();
  var pin30 = pinBuilder
    .fromText("30+", Cesium.Color.YELLOW, 48)
    .toDataURL();
  var pin20 = pinBuilder
    .fromText("20+", Cesium.Color.GREEN, 48)
    .toDataURL();
  var pin10 = pinBuilder
    .fromText("10+", Cesium.Color.BLUE, 48)
    .toDataURL();

  var singleDigitPins = new Array(8);
  for (var i = 0; i < singleDigitPins.length; ++i) {
    singleDigitPins[i] = pinBuilder
      .fromText("" + (i + 2), Cesium.Color.VIOLET, 48)
      .toDataURL();
  }

  function customStyle() {
    if (Cesium.defined(removeListener)) {
      removeListener();
      removeListener = undefined;
    } else {
      removeListener = dataSource.clustering.clusterEvent.addEventListener(
        function (clusteredEntities, cluster) {
          cluster.label.show = false;
          cluster.billboard.show = true;
          cluster.billboard.id = cluster.label.id;
          cluster.billboard.verticalOrigin =
            Cesium.VerticalOrigin.BOTTOM;

          if (clusteredEntities.length >= 50) {
            cluster.billboard.image = pin50;
          } else if (clusteredEntities.length >= 40) {
            cluster.billboard.image = pin40;
          } else if (clusteredEntities.length >= 30) {
            cluster.billboard.image = pin30;
          } else if (clusteredEntities.length >= 20) {
            cluster.billboard.image = pin20;
          } else if (clusteredEntities.length >= 10) {
            cluster.billboard.image = pin10;
          } else {
            cluster.billboard.image =
              singleDigitPins[clusteredEntities.length - 2];
          }
        }
      );
    }

    // force a re-cluster with the new styling
    var pixelRange = dataSource.clustering.pixelRange;
    dataSource.clustering.pixelRange = 0;
    dataSource.clustering.pixelRange = pixelRange;
  }

  // start with custom style
  customStyle();

  var viewModel = {
    pixelRange: pixelRange,
    minimumClusterSize: minimumClusterSize,
  };
  // Cesium.knockout.track(viewModel);
  //
  // var toolbar = document.getElementById("toolbar");
  // Cesium.knockout.applyBindings(viewModel, toolbar);
  //
  // function subscribeParameter(name) {
  //   Cesium.knockout
  //     .getObservable(viewModel, name)
  //     .subscribe(function (newValue) {
  //       dataSource.clustering[name] = newValue;
  //     });
  // }

  var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(function (movement) {
    var pickedLabel = viewer.scene.pick(movement.position);
    if (Cesium.defined(pickedLabel)) {
      var ids = pickedLabel.id;
      if (Array.isArray(ids)) {
        for (var i = 0; i < ids.length; ++i) {
          ids[i].billboard.color = Cesium.Color.RED;
        }
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
});
