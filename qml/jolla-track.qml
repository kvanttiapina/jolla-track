/*
    GPLv2 copyright here
*/

import QtQuick 2.0
import Sailfish.Silica 1.0
import QtPositioning 5.2

import "./Storage.js" as S
import "./Track.js" as T

ApplicationWindow
{
    id: app
    initialPage: Component {TrackPage {}}
    cover: Component {CoverPage {}}

    Component.onCompleted: {
        var storage = S.createController()
        storage.initDB()
        gps.signalPosition.connect(slotPosition)
    }

    signal signalReady(var pos)
    signal signalUpdateTracking

    function slotToggleTracking() {
        app.tracker.toggleTracking()
        app.signalUpdateTracking()
    }

    function slotPosition(pos) {
        // console.log("received position data")
        if (app.tracker.tracking) {
            app.tracker.updateTrack(pos, app.gps.is_valid())
        }
        app.signalReady(pos)
    }

    property var tracker: T.createController()

    property var gps: PositionSource {
        id: src
        updateInterval: 1000
        active: true

        signal signalPosition(var pos)

        onPositionChanged: src.signalPosition(src.position)

        function is_valid() {
            // return src.sourceError === PositionSource.NoError;
            return true;
        }

        function status() {
             if (src.positioningMethod === PositionSource.SatellitePositioningMethods) {return "Satellite"}
             if (src.positioningMethod === PositionSource.NoPositioningMethods) {return "Not available"}
             if (src.positioningMethod === PositionSource.NonSatellitePositioningMethods) {return "Non-satellite"}
             if (src.positioningMethod === PositionSource.AllPositioningMethods) {return "All/multiple"}
             return "This shouldn't happen -status"
        }

        function error() {
            if (src.sourceError === PositionSource.AccessError) {return "Error - No Privileges"}
            if (src.sourceError === PositionSource.ClosedError) {return "Error - No Connection"}
            if (src.sourceError === PositionSource.UnknownSourceError) {return "Error - Unknown"}
            if (src.sourceError === PositionSource.SocketError) {return "Error - Socket error"}
            if (src.sourceError === PositionSource.NoError) {return "No Error"}
            return "This shouldn't happen -error"
        }

    }
}


