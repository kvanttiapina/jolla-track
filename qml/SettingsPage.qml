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
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.top: header.bottom
            width: parent.width
            Repeater {
                id: keyrep
                model: settingsmodel
                delegate: ComboBox {
                    id: combo
                    label: model.label
                    currentIndex: model.selected
                    menu: ContextMenu {
                        Repeater {
                            model: settingsmodel.get(index).choices
                            delegate: MenuItem {
                                text: model.value
                                onClicked: app.tracker.formatter.set(model.key,
                                                                     text)
                            }
                        }
                    }
                }
            }
        }
    }
}
