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
        src.positionChanged.connect(slotPosition)
    }

    signal signalReady(var pos)
    signal signalUpdateTracking

    function slotToggleTracking() {
        app.tracker.toggleTracking()
        app.signalUpdateTracking()
    }

    function slotPosition() {
        // console.log("received position data")
        if (app.tracker.tracking) {
            app.tracker.updateTrack(src.position, src.is_valid())
        }
        app.signalReady(src.position)
    }

    property bool coverActive: false
    property bool pageActive: false

    onCoverActiveChanged: checkActiveStatus()
    onPageActiveChanged: checkActiveStatus()

    Timer {
        id: stopSrcTimer
        onTriggered: {
            if (src.active && !tracker.tracking && !coverActive && !pageActive) {
//                console.log('stopping src')
                src.stop()
            }
        }
    }

    function checkActiveStatus() {
//        console.log('coverActive = ' + coverActive)
//        console.log('pageActive = ' + pageActive)
        if (!src.active && (coverActive || pageActive)) {
//            console.log('starting src')
            src.start()
            return
        }
        if (src.active && !tracker.tracking && !coverActive && !pageActive) {
//            console.log('starting timer')
            stopSrcTimer.start()
            return
        }
    }

    property var tracker: T.createController()

    property var gps: PositionSource {
        id: src
        updateInterval: 1000
        active: false
        // nmeaSource: 'zoo.log'


        function is_valid() {
            // return src.sourceError === PositionSource.NoError
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


