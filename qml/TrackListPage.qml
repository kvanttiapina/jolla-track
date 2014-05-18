/* Initial version nicked from weightlog (c) 2014 Petr Ročkai <me@mornfall.net> */

import QtQuick 2.0

import Sailfish.Silica 1.0
import "./Storage.js" as S

Page {

    id: page
    property var storage: S.createController()

    function refresh() {
        trackmodel.clear()
        page.storage.initModel(trackmodel, app.tracker.tracking);
    }

    onStatusChanged: {
        if (page.status === PageStatus.Active) {
            console.log("refreshing track list")
            page.refresh()
        }
    }

    SilicaFlickable {
        id: flickable
        anchors.fill: parent

        VerticalScrollDecorator {flickable: flickable}

        RemorsePopup {id: remorsepop}

        function removeAll() {
            remorsepop.execute(qsTr("Deleting"), function () {
                page.storage.deleteAllTracks(app.tracker.tracking)
                page.refresh()
            })
        }

        PullDownMenu {
            MenuItem {
                text: qsTr("Delete all")
                onClicked: flickable.removeAll()
            }
            MenuItem {
                text: qsTr("Send all over bluetooth")
                // onClicked:
            }
            MenuItem {
                text: qsTr("Save all")
                // onClicked:
            }
        }

        PageHeader {title: qsTr("Tracks"); id: header}

        SilicaListView {
            id: trackview
            width: parent.width
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.top: header.bottom
            anchors.bottom: parent.bottom
            model: ListModel {id: trackmodel}

            delegate: ListItem {
                id: trackitem
                width: parent.width
                menu: contextmenu
                anchors.horizontalCenter: parent.horizontalCenter
                function remove() {
                    remorse.execute(trackitem, qsTr("Deleting"), function () {
                        page.storage.deleteTrack(trackmodel.get(index).id)
                        page.refresh()
                    })
                }

                Row {
                    width: parent.width
                    spacing: Theme.paddingLarge
                    anchors {
                        left: parent.left
                        right: parent.right
                        margins: Theme.paddingLarge
                    }

                    Label {text: model.started; color: trackitem.highlighted ? Theme.highlightColor : Theme.secondaryColor}
                    Label {text: model.records; width: parent.width/4; horizontalAlignment: Text.AlignRight}
                }

                RemorseItem {id: remorse}

                Component {
                        id: contextmenu

                        ContextMenu {
                            MenuItem {
                                text: qsTr("Save")
                                // onClicked:
                            }
                            MenuItem {
                                text: qsTr("Send over bluetooth")
                                // onClicked:
                            }
                            MenuItem {
                                text: qsTr("Delete")
                                onClicked: trackitem.remove()
                            }
                        }
                    }
            }
        }
    }
}
