/*
    GPLv2 copyright here
*/

.import QtQuick.LocalStorage 2.0 as L


var _db = L.LocalStorage.openDatabaseSync("JollaGPSTrackDB", "1.0", "Tracks", 1000000);

function getDB() {
    return L.LocalStorage.openDatabaseSync("JollaGPSTrackDB", "1.0", "Tracks", 1000000);
}

function initDB() {
    _db.transaction(function(tx) {
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


function createTrack() {
    var db = getDB();
    var track_id;
    _db.transaction(function(tx) {
        track_id = tx.executeSql('insert into tracks values (null)');
    });
    return track_id;
}


function addPosition(track_id, stamp, lat, lon, alt, hacc, vacc) {
    var data_id;
    if (!alt || !vacc) {
        _db.transaction(function(tx) {
            data_id = tx.executeSql('insert into data ' +
                                   '(track_id, stamp, latitude, longitude, horizontalAccuracy) values '  +
                                   '(?, ?, ?, ?, ?)', [track_id, stamp, lat, lon, hacc]);
        });
    } else {
        _db.transaction(function(tx) {
            data_id = tx.executeSql('insert into data ' +
                                   '(track_id, stamp, latitude, longitude, altitude, horizontalAccuracy, verticalAccuracy) values '  +
                                   '(?, ?, ?, ?, ?, ?, ?)', [track_id, stamp, lat, lon, alt, hacc, vacc]);
        });
    }

    return data_id;
}
