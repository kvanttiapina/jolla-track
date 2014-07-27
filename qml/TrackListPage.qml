/* Initial version nicked from weightlog (c) 2014 Petr Ročkai <me@mornfall.net> */

import QtQuick 2.0

import Sailfish.Silica 1.0
import Sailfish.TransferEngine 1.0

import "./Storage.js" as S
import FileIO 1.0

Page {

    id: page
    property var storage: S.createController()

    ListModel {id: trackmodel}

    function refresh() {
        trackmodel.clear()
        storage.initTrackModel(trackmodel, app.tracker.tracking);
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
        topMargin: 30
        // contentHeight: trackview.height + Theme.paddingLarge


        VerticalScrollDecorator {flickable: flickable}

        RemorsePopup {id: remorsepop}


        function removeAll() {
            remorsepop.execute(qsTr("Deleting"), function () {
                page.storage.deleteAllTracks(app.tracker.tracking)
                page.refresh()
            })
        }

        function getAllContents() {
            var now = new Date()
            var basename = 'all_tracks_' + now
            var contents = page.storage.get_all_as_gpx(basename)
            return [basename, contents]
        }

        function saveAll() {
            var stuff = getAllContents()
            var basename = stuff[0]
            var contents = stuff[1]
            var name = StandardPaths.documents + '/' + basename + '.gpx'
            console.log(name)
            gpxfile.write(name, contents)
        }

        function shareAll(name, contents) {
            var stuff = getAllContents()
            var basename = stuff[0]
            var all_tracks = stuff[1]
            var content = {
                "data": all_tracks,
                "name": basename + '.gpx',
                "type": "text/gpx",
                "icon": "icon-m-question"
            }
            shareMenu.show(content, "*", page.height/3, page)
        }

        PullDownMenu {
            MenuItem {
                text: qsTr("Delete all")
                onClicked: flickable.removeAll()
            }
            MenuItem {
                text: qsTr("Share all")
                onClicked: flickable.shareAll()
            }
            MenuItem {
                text: qsTr("Save all")
                onClicked: flickable.saveAll()
            }
        }


        ShareMenu {
            id: shareMenu
            width: parent.width
            anchors.top: parent.top
            anchors.topMargin: Theme.paddingLarge*5
        }

        PageHeader {
            id: header
            title: qsTr("Tracks")
            width: parent.width
            anchors.top: shareMenu.bottom
        }


        SilicaListView {

            id: trackview
            width: parent.width
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.top: header.bottom
            anchors.bottom: parent.bottom
            model: trackmodel

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

                function getContents() {
                    var entry = trackmodel.get(index)
                    var track_name = '' + entry.started + '-' + entry.records
                    var contents = page.storage.get_as_gpx(entry.id, track_name)
                    return [track_name, contents]
                }

                function save() {
                    var stuff = getContents()
                    var track_name = stuff[0]
                    var contents = stuff[1]
                    var name = StandardPaths.documents + '/' + track_name + '.gpx'
                    console.log(name)
                    gpxfile.write(name, contents)
                }

                function share() {
                    var stuff = getContents()
                    var track_name = stuff[0]
                    var track_contents = stuff[1]
                    var content = {
                        "data": track_contents,
                        "name": track_name + '.gpx',
                        "type": "text/gpx",
                        "icon": "icon-m-question"
                    }
                    shareMenu.show(content, "*", page.height/3, page)
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
                            text: qsTr("Share")
                            onClicked: trackitem.share()
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

