/*
    GPLv2 copyright here
*/

import QtQuick 2.0
import Sailfish.Silica 1.0
import QtPositioning 5.2

import "./Storage.js" as S

ApplicationWindow
{
    id: app
    initialPage: Component {TrackPage {}}
    cover: Qt.resolvedUrl("./CoverPage.qml")

    Component.onCompleted: {
        S.initDB()
    }

    property var gps: PositionSource {
        id: src
        updateInterval: 1000
        active: true

        signal sPosition(var position)

        onPositionChanged: src.sPosition(src.position)

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


