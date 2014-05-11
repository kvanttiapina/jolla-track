/*
    GPLv2 copyright here
*/

.import "./Storage.js" as S
.import QtPositioning 5.2 as P

var errInd = '*';
var tracking = false;

var _state = 'start';
var _track_id = 0;
var _started = new Date();
var _records = 0;
var _distance = 0;
var _speed = 0;
var _bearing = 0;
var _last_update = Date.now()
var _minimum_moving_distance = 10.0;

var _last_pos = {
    stamp: Date.now(),
    lat: 0.0,
    lon: 0.0,
    acc: 0.0,
    coord: function() {return P.QtPositioning.coordinate(this.lat, this.lon)},
};

var _state_data = {
    moving: {duration: 0, execute: _state_func_moving},
    stationary: {duration: 0, execute: _state_func_stationary},
    nofix: {duration: 0, execute: _state_func_nofix},
    start: {duration: 0, execute: _state_func_nofix},
};



function toggleTracking() {
    tracking = !tracking;
    if (!tracking) return;
    _records = 0;
    _state_data.moving.duration = 0;
    _state_data.stationary.duration = 0;
    _state_data.nofix.duration = 0;
    _state = 'start';
    _started = Date.now();
    _track_id = S.createTrack();
    _last_update = Date.now();
}


function updateTrack(pos, valid) {
    var now = Date.now()
    if (!valid) {
        _transition('nofix', now);
        return;
    }
    _state_data[_state].execute(pos, now);
}

function started() {
    if (!tracking) return errInd;
    return _started;
}

function records() {
    if (!tracking) return errInd;
    return _records;
}

function moving() {
    if (!tracking) return errInd;
    return _state_data.moving.duration;
}

function stationary() {
    if (!tracking) return errInd;
    return _state_data.stationary.duration;
}

function nofix() {
    if (!tracking) return errInd;
    return _state_data.nofix.duration;
}

function distance() {
    if (!tracking) return errInd;
    return _distance;
}

function speed() {
    if (!tracking) return errInd;
    if (_state !== 'moving') return errInd;
    return _speed;
}

function bearing() {
    if (!tracking) return errInd;
    if (_state !== 'moving') return errInd;
    return _bearing;
}

// -------------------
// Private functions
// -------------------


function _add_pos(pos) {
    if (pos.coordinate.distanceTo(_last_pos.coord()) < _minimum_moving_distance) {
        var v_alt = pos.altitudeValid ? pos.coordinate.altitude : false;
        var v_vacc = pos.verticalAccuracyValid ? pos.verticalAccuracy : false;
        S.addPosition(_track_id,
                      pos.timestamp,
                      pos.coordinate.latitude,
                      pos.coordinate.longitude,
                      v_alt,
                      pos.horizontalAccuracy,
                      v_vacc);
        _records = _records + 1;
    }

    _last_pos.stamp = pos.timestamp;
    _last_pos.lat = pos.coordinate.latitude;
    _last_pos.lon = pos.coordinate.longitude;

}

function _add_first_pos(pos) {
    var v_alt = pos.altitudeValid ? pos.coordinate.altitude : false;
    var v_vacc = pos.verticalAccuracyValid ? pos.verticalAccuracy : false;
    S.addPosition(_track_id,
                  pos.timestamp,
                  pos.coordinate.latitude,
                  pos.coordinate.longitude,
                  v_alt,
                  pos.horizontalAccuracy,
                  v_vacc);
    _records = 1;

    _last_pos.stamp = pos.timestamp;
    _last_pos.lat = pos.coordinate.latitude;
    _last_pos.lon = pos.coordinate.longitude;

}

function _check_pos(pos) {
    return pos.latitudeValid && pos.longitudeValid && pos.horizontalAccuracyValid;
}

function _is_stationary(pos) {
    return pos.coordinate.distanceTo(_last_pos.coord()) < pos.horizontalAccuracy / 2;
}

function _update_moving(pos) {
    var dist = pos.coordinate.distanceTo(_last_pos.coord());
    var duration = (pos.timestamp - _last_pos.stamp) / 1000;
    _distance = _distance + dist;
    _speed = dist / duration;
    _bearing = _last_pos.coord().azimuthTo(pos.coordinate);
}

function _state_func_nofix(pos, now) {
    if (!_check_pos(pos)) {
        _transition('nofix', now)
        return;
    }
    if (_records == 0) {
        _add_first_pos(pos)
    } else {
        _add_pos(pos);
    }
    _transition('stationary', now);
}

function _state_func_stationary(pos, now) {
    if (!_check_pos(pos) || _is_stationary(pos)) {
        _transition('stationary', now)
        return;
    }
    _update_moving(pos);
    _add_pos(pos);
    _transition('moving', now);
}

function _state_func_moving(pos, now) {
    if (!_check_pos(pos)) {
        _transition('moving', now)
        return;
    }
    if (_is_stationary(pos)) {
        _transition('stationary', now)
        return;
    }
    _update_moving(pos);
    _add_pos(pos);
    _transition('moving', now);
}

function _transition(to, tm) {
     _state_data[_state].duration = _state_data[_state].duration + (tm - _last_update);
    _state = to;
    _last_update = tm;
}

