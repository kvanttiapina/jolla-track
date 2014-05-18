/*
    GPLv2 copyright here
*/

import QtQuick 2.0
import Sailfish.Silica 1.0

import "./Track.js" as T

Page {
    id: page

    Component.onCompleted: {
        console.log("page completion")
        app.signalUpdateTracking.connect(slotUpdateTracking)
        app.applicationActiveChanged.connect(statusChanged)
        control.onClicked.connect(app.slotToggleTracking)

        if (page.status === PageStatus.Active && app.applicationActive) {
            console.log("enabling page updates")
            app.signalReady.connect(slotReady)
            app.pageActive = true
            app.gps.update()
        }
    }

    onStatusChanged: {
        if (page.status === PageStatus.Active && app.applicationActive) {
            console.log("enabling page updates")
            app.signalReady.connect(slotReady)
            app.pageActive = true
            app.gps.update()
        } else if (page.status === PageStatus.Inactive || !app.applicationActive) {
            console.log("disabling page updates")
            app.signalReady.disconnect(slotReady)
            app.pageActive = false
        }
    }

    function slotUpdateTracking() {
        control.text = app.tracker.tracking ? qsTr("Stop") : qsTr("Start")
        started.text = app.tracker.started()
        moving.text = app.tracker.moving()
        stationary.text = app.tracker.stationary()
        nofix.text = app.tracker.nofix()
        records.text = app.tracker.records()
        distance.text = app.tracker.distance()
        speed.text = app.tracker.speed()
        bearing.text = app.tracker.bearing()
    }

    function slotReady(pos) {
        source.text = app.gps.is_valid() ? app.gps.status() : app.gps.error()
        time.text = pos.timestamp

        lat.text = pos.coordinate.latitude
        if (!pos.latitudeValid) {
            lat.text = lat.text + T.errInd
        }
        lon.text = pos.coordinate.longitude
        if (!pos.longitudeValid) {
            lon.text = lon.text + T.errInd
        }
        alt.text = pos.coordinate.altitude
        if (!pos.altitudeValid) {
            alt.text = alt.text + T.errInd
        }
        hacc.text = pos.horizontalAccuracy
        if (!pos.horizontalAccuracyValid) {
            hacc.text = hacc.text + T.errInd
        }
        vacc.text = pos.verticalAccuracy
        if (!pos.verticalAccuracyValid) {
            vacc.text = vacc.text + T.errInd
        }

        if (app.tracker.tracking) {
            moving.text = app.tracker.moving()
            stationary.text = app.tracker.stationary()
            nofix.text = app.tracker.nofix()
            records.text = app.tracker.records()
            distance.text = app.tracker.distance()
            speed.text = app.tracker.speed()
            bearing.text = app.tracker.bearing()
        }
    }

    SilicaFlickable {
        id: flickable
        anchors.fill: parent
        contentHeight: column.height


        PullDownMenu {

            MenuItem {
                text: qsTr("About")
                // onClicked: pageStack.push(Qt.resolvedUrl("AboutPage.qml"))
            }
            MenuItem {
                text: qsTr("Options")
                // onClicked: pageStack.push(Qt.resolvedUrl("OptionsPage.qml"))
            }
            MenuItem {
                text: qsTr("Tracks")
                onClicked: pageStack.push(Qt.resolvedUrl("TrackListPage.qml"))
            }
            MenuItem {
                id: control
                text: app.tracker.tracking ? qsTr("Stop") : qsTr("Start")
            }
        }


        Column {
            id: column
            width: page.width
            spacing: Theme.paddingLarge


            PageHeader {title: qsTr("Track Status")}

            Row {
                spacing: Theme.paddingLarge
                anchors {
                    left: parent.left
                    right: parent.right
                    margins: Theme.paddingLarge
                }

                Column {
                    spacing: Theme.paddingLarge
                    Label {text: qsTr("Started:")}
                    Label {text: qsTr("Moving:")}
                    Label {text: qsTr("Stationary:")}
                    Label {text: qsTr("No Fix:")}
                    Label {text: qsTr("Records:")}
                    Label {text: qsTr("Distance:")}
                    Label {text: qsTr("Speed:")}
                    Label {text: qsTr("Bearing:")}
                }
                Column {
                    spacing: Theme.paddingLarge
                    Label {text: app.tracker.started(); id: started}
                    Label {text: app.tracker.moving(); id: moving}
                    Label {text: app.tracker.stationary(); id: stationary}
                    Label {text: app.tracker.nofix(); id: nofix}
                    Label {text: app.tracker.records(); id: records}
                    Label {text: app.tracker.distance(); id: distance}
                    Label {text: app.tracker.speed(); id: speed}
                    Label {text: app.tracker.bearing(); id: bearing}
                }
            }

            PageHeader {title: qsTr("Location")}

            Row {
                spacing: Theme.paddingLarge
                anchors {
                    left: parent.left
                    right: parent.right
                    margins: Theme.paddingLarge
                }
                Column {
                    spacing: Theme.paddingLarge
                    Label {text: qsTr("Source:")}
                    Label {text: qsTr("Time:")}
                    Label {text: qsTr("Latitude:")}
                    Label {text: qsTr("Longitude:")}
                    Label {text: qsTr("Altitude:")}
                    Label {text: qsTr("Hor. Acc:")}
                    Label {text: qsTr("Vert. Acc:")}
                }
                Column {
                    spacing: Theme.paddingLarge

                    Label {text: app.gps.status(); id: source}
                    Label {text: T.errInd; id: time}
                    Label {text: T.errInd; id: lat}
                    Label {text: T.errInd; id: lon}
                    Label {text: T.errInd; id: alt}
                    Label {text: T.errInd; id: hacc}
                    Label {text: T.errInd; id: vacc}
                }
            }
        }

        VerticalScrollDecorator {flickable: flickable}
    }
}
