/*
    GPLv2 copyright here
*/

.import "./Global.js" as G
.import QtQuick.LocalStorage 2.0 as L

var controlProto = {}


controlProto.initDB = function() {
    this._db.transaction(function(tx) {
            // for development
            tx.executeSql('drop table if exists tracks');
            tx.executeSql('drop table if exists data');
            tx.executeSql('create table if not exists tracks(id integer primary key)');
            tx.executeSql('create table if not exists data(id integer primary key,' +
                                                           'track_id integer not null,' +
                                                           'stamp date not null,' +
                                                           'latitude double not null,' +
                                                           'longitude double not null,' +
                                                           'altitude double,' +
                                                           'horizontalAccuracy double not null,' +
                                                           'verticalAccuracy double)');
    });
}


controlProto.createTrack = function() {
    var track_id;
    this._db.transaction(function(tx) {
        track_id = tx.executeSql('insert into tracks values (null)');
    });
    return track_id;
}


controlProto.addPosition = function(track_id, stamp, lat, lon, alt, hacc, vacc) {
    var data_id;
    if (!alt || !vacc) {
        this._db.transaction(function(tx) {
            data_id = tx.executeSql('insert into data ' +
                                   '(track_id, stamp, latitude, longitude, horizontalAccuracy) values '  +
                                   '(?, ?, ?, ?, ?)', [track_id, stamp, lat, lon, hacc]);
        });
    } else {
        this._db.transaction(function(tx) {
            data_id = tx.executeSql('insert into data ' +
                                   '(track_id, stamp, latitude, longitude, altitude, horizontalAccuracy, verticalAccuracy) values '  +
                                   '(?, ?, ?, ?, ?, ?, ?)', [track_id, stamp, lat, lon, alt, hacc, vacc]);
        });
    }

    return data_id;
}

function createController() {
    var storage = Object.create(controlProto)
    storage._db = L.LocalStorage.openDatabaseSync("JollaGPSTrackDB", "1.0", "Tracks", 1000000);
    return storage;
}
