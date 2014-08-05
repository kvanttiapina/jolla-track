/*
    GPLv2 copyright here
*/

.import "./Global.js" as G
.import QtQuick.LocalStorage 2.0 as L

var controlProto = {}


controlProto.initDB = function() {
    this._createTables()
    // delete null length tracks
    this._db.transaction(function(tx) {
        var r = tx.executeSql('select * from tracks')
        var ids = []
        var idx
        for (idx = 0; idx < r.rows.length; idx++) ids.push(r.rows.item(idx).id)

        for (idx = 0; idx < ids.length; idx++) {
            var track_id = ids[idx]
            var records = tx.executeSql('select count(id) as records from data where track_id = ?', [track_id])
            if (records.rows.item(0).records === 0) {
                tx.executeSql('delete from tracks where id = ?', [track_id])
            }
        }
    });
}


controlProto.createTrack = function() {
    var track_id;
    this._db.transaction(function(tx) {
        var r = tx.executeSql('insert into tracks values (null)');
        track_id = parseInt(r.insertId)
    });
    return track_id;
}


controlProto.initTrackModel = function(model, tracking_on) {
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
            if (records.rows.item(0).records === 0) {
                continue
            }
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


controlProto.get_as_gpx = function(track_id, name) {
    var now = new Date()
    var contents = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n' +
            '<gpx version="1.1" creator="jolla-tracker https://github.com/kvanttiapina/jolla-track" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.topografix.com/GPX/1/1" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">\n' +
            '<metadata>\n' +
            '<name>' + name + '</name>\n' +
            '<time>' + now.toUTCString() + '</time>\n' +
            '</metadata>\n' +
            '<trk><trkseg>\n'
    this._db.transaction(function(tx) {
        var r = tx.executeSql('select * from data where track_id = ?', [track_id])
        for (var idx = 0; idx < r.rows.length; idx++) {
            var p = r.rows.item(idx)
            var trkpt = '<trkpt lat="' + p.latitude + '" lon="' + p.longitude + '">\n' +
                    '<time>' + p.stamp + '</time>\n' +
                    (p.altitude ? '<ele>' + p.altitude + '</ele>\n' : '') +
                    '</trkpt>\n'
            contents = contents + trkpt
        }
    })
    contents = contents + '</trkseg></trk>\n</gpx>\n'
    return contents
}

controlProto.get_all_as_gpx = function(name) {
    var now = new Date()
    var contents = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n' +
            '<gpx version="1.1" creator="jolla-tracker https://github.com/kvanttiapina/jolla-track" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.topografix.com/GPX/1/1" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">\n' +
            '<metadata>\n' +
            '<name>' + name + '</name>\n' +
            '<time>' + now.toUTCString() + '</time>\n' +
            '</metadata>\n'
    this._db.transaction(function(tx) {
        var r0 = tx.executeSql('select * from tracks')
        for (var idx0 = 0; idx0 < r0.rows.length; idx0++) {
            var track_id = r0.rows.item(idx0).id
            var stamp = tx.executeSql('select min(id) as nu, stamp from data where track_id = ?', [track_id])
            var records = tx.executeSql('select count(id) as records from data where track_id = ?', [track_id])
            var track_name = '' + stamp.rows.item(0).stamp + '-' + records.rows.item(0).records

            var track = '<trk>\n<name>' + track_name + '</name>\n<trkseg>\n'

            var r = tx.executeSql('select * from data where track_id = ?', [track_id])
            for (var idx = 0; idx < r.rows.length; idx++) {
                var p = r.rows.item(idx)
                var trkpt = '<trkpt lat="' + p.latitude + '" lon="' + p.longitude + '">\n' +
                        '<time>' + p.stamp + '</time>\n' +
                        (p.altitude ? '<ele>' + p.altitude + '</ele>\n' : '') +
                        '</trkpt>\n'
                track = track + trkpt
            }
            track = track + '</trkseg>\n</trk>\n'
            contents = contents + track
        }
    })
    contents = contents + '</gpx>\n'
    return contents
}

controlProto.set = function(key, value) {
    this._db.transaction(function(tx) {
        var r = tx.executeSql('select * from settings where key = ?', [key])
        if (r.rows.length === 0) {
            tx.executeSql('insert into settings (key, value) values (?, ?)', [key, value]);
        } else {
            tx.executeSql('update settings set value = ? where key = ?', [value, key]);
        }
    })
}

controlProto.settings = function() {
    var settings = {}
    this._db.transaction(function(tx) {
        var r = tx.executeSql('select * from settings')
        for (var idx = 0; idx < r.rows.length; idx++) {
            var key = r.rows.item(idx).key
            var value = r.rows.item(idx).value
            settings[key] = value
        }
    });
    return settings
}



controlProto._dropTables = function() {
    this._db.transaction(function(tx) {
        tx.executeSql('drop table if exists tracks');
        tx.executeSql('drop table if exists data');
        tx.executeSql('drop table if exists settings');
    });
}

controlProto._createTables = function() {
    this._db.transaction(function(tx) {
        tx.executeSql('create table if not exists tracks(id integer primary key)');
        tx.executeSql('create table if not exists data(id integer primary key,' +
                      'track_id integer not null,' +
                      'stamp date not null,' +
                      'latitude real not null,' +
                      'longitude real not null,' +
                      'altitude real,' +
                      'horizontalAccuracy real not null,' +
                      'verticalAccuracy real)');
    tx.executeSql('create table if not exists settings(key text(32) primary key,' +
                  'value text(64) not null)');
    });
}

function createController() {
    var storage = G.create(controlProto)
    storage._db = L.LocalStorage.openDatabaseSync("JollaGPSTrackDB", "1.0", "Tracks", 1000000);
    return storage;
}
