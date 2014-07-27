import QtQuick 2.0
import Sailfish.Silica 1.0

Page {

    id: page

    ListModel {id: settingsmodel}

    Component.onCompleted: {
        console.log("settings page completion")
        app.tracker.formatter.initSettingsModel(settingsmodel);
    }

    SilicaFlickable {
        id: flickable
        anchors.fill: parent

        VerticalScrollDecorator {flickable: flickable}


        PageHeader {
            id: header
            anchors.topMargin: Theme.paddingLarge*5
            title: qsTr("Settings")
        }



        Column {

            id: settingsview
            width: parent.width
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.top: header.bottom
            Repeater {

                model: settingsmodel

                ComboBox {
                    id: combo
                    width: parent.width
                    label: model.label
                    currentIndex: model.selected
                    menu: ContextMenu {
                        Repeater {
                            width: parent.width
                            model: settingsmodel.get(index).choices
                            delegate: MenuItem {
                                text: model.name
                            }
                        }
                    }
                }
            }
        }
    }
}
