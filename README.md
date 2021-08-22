# Photon Map
## Better than nothing beta, PLEASE READ

This is just a side project of mine and is in a very unfinished state. I was going
to do more before releasing it, but I've been sitting on it for so long I may as
well just put it out there. I encourage others to help out. This is written in
basic JavaScript and is a good project to learn JS with, just as I have.

If you open an issue and ask for something to be fixed, I'll do my best to make
sure it gets done.

## Installing

First, clone the repo to your computer:

    git clone https://github.com/ckoval7/photonmap
    cd photonmap

Next, you'll need the Cesium JS library. The easiest way to get it is with NPM.

    cd html
    npm install cesium

This should create a directory called `node_modules` with a sub-directory called
`cesium`

## Running

This tool can be run from any web server, whether that's Apache, nginx, or even
a basic Python web server. The quickest way to get started is:

    cd html  # Only if you're not already in the html directory.
    python3 -m http.server

## What works right now:

- Connects to a single Kismet server.
  - `httpd_allow_cors=true` must be set in
  [`kismet_httpd.conf`](https://www.kismetwireless.net/docs/readme/webserver/)
  - optionally set `httpd_allowed_origin=http://url.of.photonmap:portnumber`
  - Will show the location of all devices last seen in a user specified time frame.
  Use 0 for unlimited.
  - Will show ADS-B devices in 3D space
- Allows the upload and display of static KML, KMZ, and GeoJSON files.
- Can send location information to a Splat! RF Propagation modeling server.

## What's planned for the future/open to contribution:

- Allow connecting to multiple Kismet servers.
- Add Sparrow WiFi front-end.
  - Back-end code is there, can even pull data, just needs user input fields.
- Crocodile Hunter Support?
- Make suggestions!
