function KismetAdsbDataSource(name) {
  //All public configuration is defined as ES5 properties
  //These are just the "private" variables and their defaults.
  this._name = name;
  this._changed = new Cesium.Event();
  this._error = new Cesium.Event();
  this._isLoading = false;
  this._loading = new Cesium.Event();
  this._entityCollection = new Cesium.EntityCollection();
  this._entityCluster = new Cesium.EntityCluster();
}

Object.defineProperties(KismetAdsbDataSource.prototype, {
  //The below properties must be implemented by all DataSource instances

  /**
   * Gets a human-readable name for this instance.
   * @memberof KismetAdsbDataSource.prototype
   * @type {String}
   */
  name: {
    get: function () {
      return this._name;
    },
  },
  /**
   * Since Kismet JSON is not time-dynamic, this property is always undefined.
   * @memberof KismetAdsbDataSource.prototype
   * @type {DataSourceClock}
   */
  clock: {
    value: undefined,
    writable: false,
  },
  /**
   * Gets the collection of Entity instances.
   * @memberof KismetAdsbDataSource.prototype
   * @type {EntityCollection}
   */
  entities: {
    get: function () {
      return this._entityCollection;
    },
  },
  /**
   * Gets a value indicating if the data source is currently loading data.
   * @memberof KismetAdsbDataSource.prototype
   * @type {Boolean}
   */
  isLoading: {
    get: function () {
      return this._isLoading;
    },
  },
  /**
   * Gets an event that will be raised when the underlying data changes.
   * @memberof KismetAdsbDataSource.prototype
   * @type {Event}
   */
  changedEvent: {
    get: function () {
      return this._changed;
    },
  },
  /**
   * Gets an event that will be raised if an error is encountered during
   * processing.
   * @memberof KismetAdsbDataSource.prototype
   * @type {Event}
   */
  errorEvent: {
    get: function () {
      return this._error;
    },
  },
  /**
   * Gets an event that will be raised when the data source either starts or
   * stops loading.
   * @memberof KismetAdsbDataSource.prototype
   * @type {Event}
   */
  loadingEvent: {
    get: function () {
      return this._loading;
    },
  },
  /**
   * Gets or sets the clustering options for this data source. This object can be shared between multiple data sources.
   * @memberof KismetAdsbDataSource.prototype
   * @type {EntityCluster}
   */
  clustering: {
    get: function () {
      return this._entityCluster;
    },
    set: function (value) {
      if (!Cesium.defined(value)) {
        throw new Cesium.DeveloperError("value must be defined.");
      }
      this._entityCluster = value;
    },
  },
});

KismetAdsbDataSource.prototype.loadUrl = function (url, user, passwd) {
  let headers= {
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      'Authorization': "Basic " + btoa(user + ":" + passwd)
  }

  var fields = {
  	'fields':
    ["kismet.device.base.name",
  	"kismet.device.base.location/kismet.common.location.last/kismet.common.location.geopoint",
  	"kismet.device.base.location/kismet.common.location.last/kismet.common.location.alt",
  	"kismet.device.base.location/kismet.common.location.last/kismet.common.location.speed",
  	"kismet.device.base.location/kismet.common.location.last/kismet.common.location.heading",
  	"kismet.device.base.key",
  	"kismet.device.base.type",
  	"rtladsb.device/rtladsb.device.icao",
  	"rtladsb.device/rtladsb.device.callsign",
    "kismet.device.base.last_time"
  	]
  }

  const data = "json=" + JSON.stringify(fields)

  if (!Cesium.defined(url)) {
    throw new Cesium.DeveloperError("url is required.");
  }

  //Create a name based on the url
  var name = Cesium.getFilenameFromUri(url);

  //Set the name if it is different than the current name.
  if (this._name !== name) {
    this._name = name;
    this._changed.raiseEvent(this);
  }

  //Use 'when' to load the URL into a json object
  //and then process is with the `load` function.
  var that = this;
  return Cesium.Resource.post({url: url, headers: headers, data:data, responseType: "json"})
    .then(function (json) {
      return that.load(json, url);
    })
    .otherwise(function (error) {
      //Otherwise will catch any errors or exceptions that occur
      //during the promise processing. When this happens,
      //we raise the error event and reject the promise.
      this._setLoading(false);
      that._error.raiseEvent(that, error);
      return Cesium.when.reject(error);
    });
};

/**
 * Loads the provided data, replacing any existing data.
 * @param {Array} data The object to be processed.
 */
KismetAdsbDataSource.prototype.load = function (data) {
  //>>includeStart('debug', pragmas.debug);
  if (!Cesium.defined(data)) {
    throw new Cesium.DeveloperError("data is required.");
  }
  //>>includeEnd('debug');

  //Clear out any data that might already exist.
  this._setLoading(true);
  let entities = this._entityCollection;

  //It's a good idea to suspend events when making changes to a
  //large amount of entities.  This will cause events to be batched up
  //into the minimal amount of function calls and all take place at the
  //end of processing (when resumeEvents is called).
  entities.suspendEvents();
  entities.removeAll();
  // Loop over each series
  // for (var dev = 0; dev < data.length; dev++) {
  for (let dev of data) {
    if(dev['kismet.common.location.geopoint'] != 0) {
      if(!(dev['kismet.common.location.geopoint'][0] == 0 &&
      dev['kismet.common.location.geopoint'][1] == 0)) {
      // console.log(dev['rtladsb.device.callsign']);
      let longitude = dev['kismet.common.location.geopoint'][0];
      let latitude = dev['kismet.common.location.geopoint'][1];
      let altitude = dev['kismet.common.location.alt'];
      let altitudeFt = Math.round(dev['kismet.common.location.alt']*3.2808);
      let heading = dev['kismet.common.location.heading'];
      let position = Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude);
      let hpr = Cesium.HeadingPitchRoll.fromDegrees(0, 90, 360 - (180 + heading));
      let orientation = Cesium.Transforms.headingPitchRollQuaternion(position,hpr);
      let description = `
      <div style="font-size: 16pt;">
        ${dev['kismet.device.base.type']}<br>
        Name: ${dev['kismet.device.base.name']}<br>
        Callsign: ${dev['rtladsb.device.callsign']}<br>
        Heading: ${Math.round(heading)}&deg;<br>
        Speed: ${Math.round(dev['kismet.common.location.speed'])} MPH<br>
        Location: ${latitude}&deg;, ${longitude}&deg;<br>
        Altitude: ${altitudeFt} Ft
      </div>
      `;

      var entity = new Cesium.Entity({
        id: dev['kismet.device.base.key'],
        name: dev['rtladsb.device.callsign'],
        position: position,
        description: description,
        label: {
          text: `Altitude: ${altitudeFt} ft`,
          font: '20px sans-serif',
          showBackground: true,
          translucencyByDistance: new Cesium.NearFarScalar(
            5e4,
            1.0,
            2e6,
            0.0
          ),
          scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1, 5e5, 0.6),
          pixelOffset: new Cesium.Cartesian2(0, 30),
          pixelOffsetScaleByDistance: new Cesium.NearFarScalar(
            200,
            4,
            10e3,
            0
          ),
        },
        model: {
          uri: "/img/737.glb",
          minimumPixelSize: 32,
          color: Cesium.Color.ORANGE,
          shadows: Cesium.ShadowMode.DISABLED,
          colorBlendMode: Cesium.ColorBlendMode.MIX
        },
        orientation: orientation
      });
      entities.add(entity);
    }
  }
  }

  //Once all data is processed, call resumeEvents and raise the changed event.
  entities.resumeEvents();
  this._changed.raiseEvent(this);
  this._setLoading(false);
};

KismetAdsbDataSource.prototype._setLoading = function (isLoading) {
  if (this._isLoading !== isLoading) {
    this._isLoading = isLoading;
    this._loading.raiseEvent(this, isLoading);
  }
};
