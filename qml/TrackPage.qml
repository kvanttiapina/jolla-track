/*
    GPLv2 copyright here
*/

import QtQuick 2.0
import Sailfish.Silica 1.0

import "./Track.js" as T

Page {
    id: page

    Component.onCompleted: {
        app.gps.sPosition.connect(updatePosition)
    }


    function toggleTracking() {
        T.toggleTracking()
        control.text = T.tracking ? qsTr("Stop") : qsTr("Start")
        started.text = T.started()
        moving.text = T.moving()
        stationary.text = T.stationary()
        nofix.text = T.nofix()
        records.text = T.records()
        distance.text = T.distance()
        speed.text = T.speed()
        bearing.text = T.bearing()
    }

    function updatePosition(pos) {
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

        if (T.tracking) {
            T.updateTrack(pos, app.gps.is_valid())
            moving.text = T.moving()
            stationary.text = T.stationary()
            nofix.text = T.nofix()
            records.text = T.records()
            distance.text = T.distance()
            speed.text = T.speed()
            bearing.text = T.bearing()
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
//            MenuItem {
//                text: qsTr("Options")
//                onClicked: pageStack.push(Qt.resolvedUrl("OptionsPage.qml"))
//            }
            MenuItem {
                text: qsTr("Tracks")
                // onClicked: pageStack.push(Qt.resolvedUrl("TrackPage.qml"))
            }
            MenuItem {
                id: control
                text: qsTr("Start")
                onClicked: page.toggleTracking()
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
                    Label {text: T.errInd; id: started}
                    Label {text: T.errInd; id: moving}
                    Label {text: T.errInd; id: stationary}
                    Label {text: T.errInd; id: nofix}
                    Label {text: T.errInd; id: records}
                    Label {text: T.errInd; id: distance}
                    Label {text: T.errInd; id: speed}
                    Label {text: T.errInd; id: bearing}
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
