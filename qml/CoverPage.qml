/*
    GPLv2 copyright here
*/

import QtQuick 2.0
import Sailfish.Silica 1.0
import "./Track.js" as T

CoverBackground {
    id: cover

    Component.onCompleted: {
        console.log("coverpage completion")
        app.signalUpdateTracking.connect(slotUpdateTracking)
        coverAction.onTriggered.connect(app.slotToggleTracking)
        if (cover.status === Cover.Active) {
            console.log("enabling cover updates")
            app.signalReady.connect(slotReady)
            app.coverActive = true
            app.gps.update()
        }
    }

    onStatusChanged: {
        if (cover.status === Cover.Inactive) {
            console.log("disabling cover updates")
            app.signalReady.disconnect(slotReady)
            app.coverActive = false
        } else if (cover.status === Cover.Active) {
            console.log("enabling cover updates")
            app.signalReady.connect(slotReady)
            app.coverActive = true
            app.gps.update()
        }
    }

    function slotUpdateTracking() {
        coverAction.iconSource =  app.tracker.tracking ? "image://theme/icon-cover-cancel" : "image://theme/icon-cover-new"
        records.text = app.tracker.records()
        distance.text = app.tracker.distance()
        speed.text = app.tracker.speed()
        bearing.text = app.tracker.bearing()
    }

    function slotReady(pos) {
        lat.text = pos.coordinate.latitude
        if (!pos.latitudeValid) {
            lat.text = lat.text + T.errInd
        }
        lon.text = pos.coordinate.longitude
        if (!pos.longitudeValid) {
            lon.text = lon.text + T.errInd
        }

        if (app.tracker.tracking) {
            records.text = app.tracker.records()
            distance.text = app.tracker.distance()
            speed.text = app.tracker.speed()
            bearing.text = app.tracker.bearing()
        }
    }

    Column {
        width: cover.width

        Row {
            anchors {
                left: parent.left
                right: parent.right
                margins: Theme.paddingSmall
            }

            Column {
                spacing: Theme.paddingSmall
                Label {text: qsTr("Lat:")}
                Label {text: qsTr("Long:")}
                Label {text: qsTr("Recs:")}
                Label {text: qsTr("Dist:")}
                Label {text: qsTr("Speed:")}
                Label {text: qsTr("Bearing:")}
            }
            Column {
                spacing: Theme.paddingSmall
                Label {text: T.errInd; id: lat}
                Label {text: T.errInd; id: lon}
                Label {text: app.tracker.records(); id: records}
                Label {text: app.tracker.distance(); id: distance}
                Label {text: app.tracker.speed(); id: speed}
                Label {text: app.tracker.bearing(); id: bearing}
            }
        }

    }


    CoverActionList {

        CoverAction {
            id: coverAction
            iconSource: app.tracker.tracking ? "image://theme/icon-cover-cancel" : "image://theme/icon-cover-new"
        }
    }
}


