# NOTICE:
#
# Application name defined in TARGET has a corresponding QML filename.
# If name defined in TARGET is changed, the following needs to be done
# to match new name:
#   - corresponding QML filename must be changed
#   - desktop icon filename must be changed
#   - desktop filename must be changed
#   - icon definition filename in desktop file must be changed
#   - translation filenames have to be changed

# The name of your application
TARGET = jolla-track

CONFIG += sailfishapp

SOURCES += src/main.cpp

OTHER_FILES += qml/jolla-track.qml \
    qml/CoverPage.qml \
    qml/TrackPage.qml \
    qml/Track.js \
    qml/Storage.js \
    rpm/jolla-track.yaml \
    jolla-track.desktop \
    jolla-track.png \
    qml/Global.js \
    qml/TrackListPage.qml

