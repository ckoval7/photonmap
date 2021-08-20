function SparrowDataSource(name) {
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

Object.defineProperties(SparrowDataSource.prototype, {
  //The below properties must be implemented by all DataSource instances

  /**
   * Gets a human-readable name for this instance.
   * @memberof SparrowDataSource.prototype
   * @type {String}
   */
  name: {
    get: function () {
      return this._name;
    },
  },
  /**
   * Since Kismet JSON is not time-dynamic, this property is always undefined.
   * @memberof SparrowDataSource.prototype
   * @type {DataSourceClock}
   */
  clock: {
    value: undefined,
    writable: false,
  },
  /**
   * Gets the collection of Entity instances.
   * @memberof SparrowDataSource.prototype
   * @type {EntityCollection}
   */
  entities: {
    get: function () {
      return this._entityCollection;
    },
  },
  /**
   * Gets a value indicating if the data source is currently loading data.
   * @memberof SparrowDataSource.prototype
   * @type {Boolean}
   */
  isLoading: {
    get: function () {
      return this._isLoading;
    },
  },
  /**
   * Gets an event that will be raised when the underlying data changes.
   * @memberof SparrowDataSource.prototype
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
   * @memberof SparrowDataSource.prototype
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
   * @memberof SparrowDataSource.prototype
   * @type {Event}
   */
  loadingEvent: {
    get: function () {
      return this._loading;
    },
  },
  /**
   * Gets or sets the clustering options for this data source. This object can be shared between multiple data sources.
   * @memberof SparrowDataSource.prototype
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

SparrowDataSource.prototype.loadUrl = function (url) {
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
  return Cesium.Resource.fetchJson({url: url})
    .then(function (json) {
      // console.log(json);
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
SparrowDataSource.prototype.load = function (data) {
  //>>includeStart('debug', pragmas.debug);
  if (!Cesium.defined(data)) {
    throw new Cesium.DeveloperError("data is required.");
  }
  //>>includeEnd('debug');

  //Clear out any data that might already exist.
  this._setLoading(true);
  var entities = this._entityCollection;

  //It's a good idea to suspend events when making changes to a
  //large amount of entities.  This will cause events to be batched up
  //into the minimal amount of function calls and all take place at the
  //end of processing (when resumeEvents is called).
  entities.suspendEvents();
  entities.removeAll();

  var apDensityCounter = {};
  // Loop over each series
  // for (var dev = 0; dev < data.length; dev++) {
  for (let dev of data['networks']) {
    if(dev['gpsvalid'] == "True") {
      let longitude = Number(dev['lon']).toFixed(5);
      let latitude = Number(dev['lat']).toFixed(5);
      if (apDensityCounter[`${latitude}.${longitude}`]) {
        apDensityCounter[`${latitude}.${longitude}`]['counter']++;
      } else {
        apDensityCounter[`${latitude}.${longitude}`] = {
          counter: 1,
          latitude: latitude,
          longitude: longitude,
          accessPoints: 0,
          accessPointTable: '',
          btle: 0,
          btleTable: '',
          brEdr: 0,
          brEdrTable: '',
          others: 0,
          othersTable: ''
        }
      }

      let devname = "";
      if(dev['ssid'] !== "") {
        devname = dev['ssid'];
      } else {
        devname = dev['macAddr'];
      }
      // if (dev['type'].includes("BTLE")) {
      //   apDensityCounter[`${latitude}.${longitude}`]['btle']++;
      //   apDensityCounter[`${latitude}.${longitude}`]['btleTable'] += `
      //   <tr>
      //     <td>${devname}</td>
      //     <td>${dev['kismet.device.base.macaddr']}</td>
      //     <td>${dev['kismet.common.signal.max_signal']}</td>
      //   </tr>
      //   `;
      // } else if(dev['type'].includes("BR/EDR")) {
      //   apDensityCounter[`${latitude}.${longitude}`]['brEdr']++;
      //   apDensityCounter[`${latitude}.${longitude}`]['brEdrTable'] += `
      //   <tr>
      //     <td>${devname}</td>
      //     <td>${dev['kismet.device.base.macaddr']}</td>
      //     <td>${dev['kismet.common.signal.max_signal']}</td>
      //   </tr>
      //   `;
      // }
      if(dev['type'].includes("wifi-ap")) {
        apDensityCounter[`${latitude}.${longitude}`]['accessPoints']++;
        apDensityCounter[`${latitude}.${longitude}`]['accessPointTable'] += `
        <tr>
          <td>${devname}</td>
          <td>${dev['macAddr']}</td>
          <td>${dev['security']}</td>
          <td>${dev['strongestsignal']}</td>
        </tr>
        `;
      } else {
        apDensityCounter[`${latitude}.${longitude}`]['others']++;
        apDensityCounter[`${latitude}.${longitude}`]['othersTable'] += `
        <tr>
          <td>${devname}</td>
          <td>${dev['macAddr']}</td>
          <td>${dev['type']}</td>
          <td>${dev['strongestsignal']}</td>
        </tr>
        `;
      }
    }
  }

  var baseHtmlHead = `
  <html>
  <head>
    <style>
      .collapsible {
        display: block;
      }
      input {
        position: absolute;
        left: -9999px;
        &:focus ~ .collapser{
          border-color: grey;
        }
      }

      .collapser {
        cursor: pointer;
        border: 1px transparent dotted;
        /*background-color: #eee;
        color: #444;*/
        font-size: 16px;
      }

      .collapser:hover {
        background-color: #ccc;
      }

      .arrow {
        float: right;
        margin-left: 0.5em;
        display: inline-block;
        transform: rotate(90deg);
        transition: transform .25s ease-out;
      }

      input:checked ~ .arrow,
      input:checked ~ .collapser .arrow {
        transform: rotate(270deg);
      }

      .collapsed {
        font-size: 0;
        margin: 0;
        opacity: 0;
        padding: 0;
        background: #eee;
        display: none;
        overflow: hidden;

        /* fade out, then shrink */
        transition:
          opacity .25s,
          margin .5s 0.25s,
          font-size .5s 0.25s,
          padding .5s .25s;
      }

      input:checked ~ .collapsed {
        /*font-size: 16px;*/
        opacity: 1;
        height: auto;
        padding: 5px 0;
        display: block;

        /* grow, then fade in */
        transition:
          margin .25s,
          padding .25s,
          font-size .25s,
          opacity .5s .25s;
      }

      table, th, td {
        border: 1px solid black;
        border-collapse: collapse;
        text-align: right;
        color: black;
        font-size: 14px;
      }
    </style>
  </head>
  <body>`;

  var baseHtmlTail = `
  <script>
  function sortTable(n) {
    var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    table = document.getElementById("myTable2");
    switching = true;
    // Set the sorting direction to ascending:
    dir = "asc";
    /* Make a loop that will continue until
    no switching has been done: */
    while (switching) {
      // Start by saying: no switching is done:
      switching = false;
      rows = table.rows;
      /* Loop through all table rows (except the
      first, which contains table headers): */
      for (i = 1; i < (rows.length - 1); i++) {
        // Start by saying there should be no switching:
        shouldSwitch = false;
        /* Get the two elements you want to compare,
        one from current row and one from the next: */
        x = rows[i].getElementsByTagName("TD")[n];
        y = rows[i + 1].getElementsByTagName("TD")[n];
        /* Check if the two rows should switch place,
        based on the direction, asc or desc: */
        if (dir == "asc") {
          if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
            // If so, mark as a switch and break the loop:
            shouldSwitch = true;
            break;
          }
        } else if (dir == "desc") {
          if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
            // If so, mark as a switch and break the loop:
            shouldSwitch = true;
            break;
          }
        }
      }
      if (shouldSwitch) {
        /* If a switch has been marked, make the switch
        and mark that a switch has been done: */
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
        switching = true;
        // Each time a switch is done, increase this count by 1:
        switchcount ++;
      } else {
        /* If no switching has been done AND the direction is "asc",
        set the direction to "desc" and run the while loop again. */
        if (switchcount == 0 && dir == "asc") {
          dir = "desc";
          switching = true;
        }
      }
    }
  }
  </script>
  </body>
  </html>
  `;

  var tableTail = `
      </table>
    </div>
  </label>
  `;

  var maxDensityFinder = [];
  for (let loc in apDensityCounter) {
    let currentLoc = apDensityCounter[loc];
    if (currentLoc.counter > 1) {
      maxDensityFinder.push(currentLoc.counter);
    }
  }
  var maxDensity = 1 + (10 * ( Math.log(Math.max(...maxDensityFinder)) / Math.log(10) ));

  for (let loc in apDensityCounter) {
    let currentLoc = apDensityCounter[loc];
    // console.log(`${loc}: ${currentLoc.counter}, ${currentLoc.latitude}, ${currentLoc.longitude}`);
    // let description = `
    // <div style="font-size: 16pt;">
    //   ${currentLoc.counter} Devices
    // </div>
    // `;
    var accessPointMenuHead = `
    <label class="collapsible">
      <input type="checkbox" />
      <span class="collapser">Access Points: ${currentLoc.accessPoints}</span>
      <span class="arrow">&gt;</span>
      <div class="collapsed">
        <table style="width:100%">
          <tr>
            <th onclick="sortTable(0)">SSID</th>
            <th onclick="sortTable(1)">MAC Address</th>
            <th onclick="sortTable(2)">Security</th>
            <th onclick="sortTable(3)">Max RSSI</th>
          </tr>
    `;
    //
    // var btleMenuHead = `
    // <label class="collapsible">
    //   <input type="checkbox" />
    //   <span class="collapser">BTLE: ${currentLoc.btle}</span>
    //   <span class="arrow">&gt;</span>
    //   <div class="collapsed">
    //     <table style="width:100%">
    //       <tr>
    //         <th>Name</th>
    //         <th>MAC Address</th>
    //         <th>Max RSSI</th>
    //       </tr>
    //     `;
    //
    // var brEdrMenuHead = `
    // <label class="collapsible">
    //   <input type="checkbox" />
    //   <span class="collapser">BR/EDR: ${currentLoc.brEdr}</span>
    //   <span class="arrow">&gt;</span>
    //   <div class="collapsed">
    //     <table style="width:100%">
    //       <tr>
    //         <th>Name</th>
    //         <th>MAC Address</th>
    //         <th>Max RSSI</th>
    //       </tr>
    // `;

    var otherMenuHead = `
    <label class="collapsible">
      <input type="checkbox" />
      <span class="collapser">Other Devices: ${currentLoc.others}</span>
      <span class="arrow">&gt;</span>
      <div class="collapsed">
        <table style="width:100%">
          <tr>
            <th>Name</th>
            <th>MAC Address</th>
            <th>Type</th>
            <th>Max RSSI</th>
          </tr>
    `;

    let description =
      baseHtmlHead +
      accessPointMenuHead +
      currentLoc.accessPointTable +
      tableTail +
      // btleMenuHead +
      // currentLoc.btleTable +
      // tableTail +
      // brEdrMenuHead +
      // currentLoc.brEdrTable +
      // tableTail +
      otherMenuHead +
      currentLoc.othersTable +
      tableTail +
      baseHtmlTail;

    let height = 1 + (10 * ( Math.log(currentLoc.counter) / Math.log(10) ));
    let hue = (-height/(maxDensity * 2)) + 0.5;
    let color = Cesium.Color.fromHsl(hue, 1.0, 0.5);
    var entity = new Cesium.Entity({
      id: loc,
      name: loc,
      position: Cesium.Cartesian3.fromDegrees(currentLoc.longitude, currentLoc.latitude),
      polyline: {
        positions: [
          Cesium.Cartesian3.fromDegrees(currentLoc.longitude, currentLoc.latitude, 0),
          Cesium.Cartesian3.fromDegrees(currentLoc.longitude, currentLoc.latitude, height)
        ],
        arcType: Cesium.ArcType.NONE,
        material: new Cesium.PolylineGlowMaterialProperty({
          color: color
        }),
        width: 5,
      },
      point: {
        color: color,
        pixelSize: 10,
        scaleByDistance: new Cesium.NearFarScalar(1000, 1, 5e6, 1.5)
      },
      description: description
    });
    entities.add(entity);
  }
  //Once all data is processed, call resumeEvents and raise the changed event.
  entities.resumeEvents();
  this._changed.raiseEvent(this);
  this._setLoading(false);
};

SparrowDataSource.prototype._setLoading = function (isLoading) {
  if (this._isLoading !== isLoading) {
    this._isLoading = isLoading;
    this._loading.raiseEvent(this, isLoading);
  }
};
