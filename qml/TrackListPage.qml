/* Initial version nicked from weightlog (c) 2014 Petr Ročkai <me@mornfall.net> */

import QtQuick 2.0

import Sailfish.Silica 1.0
import "./Storage.js" as S
import FileIO 1.0

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

    FileIO {
        id: gpxfile
        onError: console.log(msg)
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

        function saveAll() {
            var now = new Date()
            var basename = 'all_tracks_' + now
            var name = StandardPaths.documents + '/' + basename + '.gpx'
            var contents = page.storage.get_all_as_gpx(basename)
            gpxfile.write(name, contents)
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
                onClicked: flickable.saveAll()
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

                function save() {
                    var entry = trackmodel.get(index)
                    var track_name = '' + entry.started + '-' + entry.records
                    var name = StandardPaths.documents + '/' + track_name + '.gpx'
                    console.log(name)
                    var contents = page.storage.get_as_gpx(entry.id, track_name)
                    gpxfile.write(name, contents)
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
                                onClicked: trackitem.save()
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
