/*
    GPLv2 copyright here
*/

import QtQuick 2.0
import Sailfish.Silica 1.0

Page {
    id: about


    SilicaFlickable {
        id: flickable
        anchors.fill: parent
        contentHeight: column.height

        Column {
            id: column
            width: about.width
            spacing: Theme.paddingLarge


            PageHeader {title: qsTr("Jolla Tracker")}

            Text {
                anchors {left: parent.left; right: parent.right}
                horizontalAlignment: Text.AlignHCenter
                font.pixelSize: Theme.fontSizeMedium
                wrapMode: Text.Wrap
                text: "GPS track recorder.\n" +
                      "Adapted from GPSTrack (http://qcontinuum.org/gpstrack/)\n" +
                      "v" + '0.9' + "\n\n" +
                      "Copyright (c) Antero Holmström\nLicensed under GNU GPLv2"
            }

            Button {
                anchors.horizontalCenter: parent.horizontalCenter
                text: "Source Repository"
                onClicked: globalUtils.createOpenLinkDialog(QMLUtils.SOURCE_REPO_URL);
            }

            Button {
                anchors.horizontalCenter: parent.horizontalCenter
                text: "License"
                onClicked: globalUtils.createOpenLinkDialog(QMLUtils.GPL2_LICENSE_URL);
            }
        }
        VerticalScrollDecorator {flickable: flickable}
    }
}
