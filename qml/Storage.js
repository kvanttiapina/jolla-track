/*
    GPLv2 copyright here
*/

.import "./Global.js" as G
.import QtQuick.LocalStorage 2.0 as L

var controlProto = {}


controlProto.initDB = function() {
    this._createTables()
}


controlProto.createTrack = function() {
    var track_id;
    this._db.transaction(function(tx) {
        var r = tx.executeSql('insert into tracks values (null)');
        track_id = parseInt(r.insertId)
    });
    return track_id;
}


controlProto.initModel = function(model, tracking_on) {
    this._db.transaction(function(tx) {
        var r = tx.executeSql('select * from tracks')
        var ids = []
        var idx;
        for (idx = 0; idx < r.rows.length; idx++) ids.push(r.rows.item(idx).id)
        if (tracking_on) {
            ids.sort()
            ids.pop()
        }

        for (idx = 0; idx < ids.length; idx++) {
            var track_id = ids[idx]
            var stamp = tx.executeSql('select min(id) as nu, stamp from data where track_id = ?', [track_id])
            var records = tx.executeSql('select count(id) as records from data where track_id = ?', [track_id])
            model.append({'id': track_id, 'started': stamp.rows.item(0).stamp, 'records': records.rows.item(0).records})
        }
    });
}

controlProto.deleteTrack = function(track_id) {
    this._db.transaction(function(tx) {
        tx.executeSql('delete from data where track_id = ?', [track_id]);
        tx.executeSql('delete from tracks where id = ?', [track_id]);
    });
}

controlProto.deleteAllTracks = function(tracking_on) {
    this._db.transaction(function(tx) {
        var r = tx.executeSql('select * from tracks')
        var ids = []
        var idx;
        for (idx = 0; idx < r.rows.length; idx++) ids.push(r.rows.item(idx).id)
        if (tracking_on) {
            ids.sort()
            ids.pop()
        }
        for (idx = 0; idx < ids.length; idx++) {
            var track_id = ids[idx]
            tx.executeSql('delete from data where track_id = ?', [track_id]);
            tx.executeSql('delete from tracks where id = ?', [track_id]);
        }
    });
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

    return parseInt(data_id.insertId);
}


controlProto._dropTables = function() {
    this._db.transaction(function(tx) {
        tx.executeSql('drop table if exists tracks');
        tx.executeSql('drop table if exists data');
    });
}

controlProto._createTables = function() {
    this._db.transaction(function(tx) {
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

function createController() {
    var storage = Object.create(controlProto)
    storage._db = L.LocalStorage.openDatabaseSync("JollaGPSTrackDB", "1.0", "Tracks", 1000000);
    return storage;
}
