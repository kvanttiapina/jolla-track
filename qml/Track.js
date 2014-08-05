/*
    GPLv2 copyright here
*/

.import "./Global.js" as G
.import "./Storage.js" as S
.import "./Formatter.js" as F
.import QtPositioning 5.2 as P

var errInd = '*';

var controlProto = {}

controlProto.toggleTracking = function () {
    this.tracking = !this.tracking;
    if (!this.tracking) return;
    this._records = 0;
    this._state_data.moving.duration = 0;
    this._state_data.stationary.duration = 0;
    this._state_data.nofix.duration = 0;
    this._state = 'start';
    this._started = Date.now();
    this._track_id = this._storage.createTrack();
    this._last_update = Date.now();
}


controlProto.updateTrack = function(pos, valid) {
    if (!this.tracking) return
    var now = Date.now()
    if (!valid) {
        this._transition('nofix', now);
        return;
    }
    this._state_data[this._state].execute(pos, now);
}


controlProto.started = function() {
    if (!this.tracking) return errInd;
    return this.formatter.date(this._started);
}

controlProto.records = function() {
    if (!this.tracking) return errInd;
    return this._records;
}

controlProto.moving = function() {
    if (!this.tracking) return errInd;
    return this.formatter.duration(this._state_data.moving.duration);
}

controlProto.stationary = function() {
    if (!this.tracking) return errInd;
    return this.formatter.duration(this._state_data.stationary.duration);
}

controlProto.nofix = function() {
    if (!this.tracking) return errInd;
    return this.formatter.duration(this._state_data.nofix.duration);
}

controlProto.distance = function() {
    if (!this.tracking) return errInd;
    return this.formatter.distance(this._distance);
}

controlProto.speed = function() {
    if (!this.tracking) return errInd;
    var speed = this.formatter.speed(this._speed)
    if (this._state !== 'moving') speed += errInd
    return speed
}

controlProto.bearing = function() {
    if (!this.tracking) return errInd
    var bearing = this.formatter.bearing(this._bearing)
    if (this._state !== 'moving') bearing += errInd
    return bearing;
}

// -------------------
// Private functions
// -------------------


controlProto._add_pos = function(pos) {
    var moved = pos.coordinate.distanceTo(this._last_pos.coord())

    if (moved < this._minimum_moving_distance || moved > this._maximum_moving_distance) {
        return
    }
    var v_alt = pos.altitudeValid ? pos.coordinate.altitude : false;
    var v_vacc = pos.verticalAccuracyValid ? pos.verticalAccuracy : false;
    this._storage.addPosition(this._track_id,
                              pos.timestamp,
                              pos.coordinate.latitude,
                              pos.coordinate.longitude,
                              v_alt,
                              pos.horizontalAccuracy,
                              v_vacc);

    this._records += 1;

    this._last_pos.stamp = pos.timestamp;
    this._last_pos.lat = pos.coordinate.latitude;
    this._last_pos.lon = pos.coordinate.longitude;

}

controlProto._add_first_pos = function(pos) {
    var v_alt = pos.altitudeValid ? pos.coordinate.altitude : false;
    var v_vacc = pos.verticalAccuracyValid ? pos.verticalAccuracy : false;
    this._storage.addPosition(this._track_id,
                  pos.timestamp,
                  pos.coordinate.latitude,
                  pos.coordinate.longitude,
                  v_alt,
                  pos.horizontalAccuracy,
                  v_vacc);
    this._records = 1;

    this._last_pos.stamp = pos.timestamp;
    this._last_pos.lat = pos.coordinate.latitude;
    this._last_pos.lon = pos.coordinate.longitude;

}

controlProto._check_pos = function(pos) {
    return pos.latitudeValid && pos.longitudeValid && pos.horizontalAccuracyValid;
}

controlProto._is_stationary = function(pos) {
    var moved = pos.coordinate.distanceTo(this._last_pos.coord())
    if (moved < pos.horizontalAccuracy / 2) return true
    var in_move = this._history.current() === 'moving' || this._history.previous() === 'moving'
    if (moved < pos.horizontalAccuracy) {
        if (in_move) return false
        return true
    }
    return false
}

controlProto._update_moving = function(pos) {
    var moved = pos.coordinate.distanceTo(this._last_pos.coord())

    if (moved < this._minimum_moving_distance || moved > this._maximum_moving_distance) {
        return
    }

    var dist = pos.coordinate.distanceTo(this._last_pos.coord());
    var duration = (pos.timestamp - this._last_pos.stamp) / 1000;
    this._distance += dist;
    this._speed = dist / duration;
    this._bearing = this._last_pos.coord().azimuthTo(pos.coordinate);
}


controlProto._transition = function(to, tm) {
    this._history.update(to)
    this._state_data[this._state].duration = this._state_data[this._state].duration + (tm - this._last_update);
    this._state = to;
    this._last_update = tm;
}


// ------------------------------
// states
// ------------------------------

var nofixProto = {}
nofixProto.execute = function(pos, now) {
    if (!this.parent._check_pos(pos)) {
        this.parent._transition('nofix', now)
        return;
    }
    if (this.parent._records === 0) {
        this.parent._add_first_pos(pos)
    } else {
        this.parent._add_pos(pos);
    }
    this.parent._transition('stationary', now);
}

var stationaryProto = {}
stationaryProto.execute = function(pos, now) {
    if (!this.parent._check_pos(pos)) {
        this.parent._transition('nofix', now)
        return
    }
    if (this.parent._is_stationary(pos)) {
        this.parent._transition('stationary', now)
        return
    }
    this.parent._update_moving(pos)
    this.parent._add_pos(pos)
    this.parent._transition('moving', now)
}

var movingProto = {}
movingProto.execute = function(pos, now) {
    if (!this.parent._check_pos(pos)) {
        this.parent._transition('nofix', now)
        return
    }
    if (this.parent._is_stationary(pos)) {
        this.parent._transition('stationary', now)
        return
    }
    this.parent._update_moving(pos);
    this.parent._add_pos(pos)
    this.parent._transition('moving', now);
}


// ------------------------------
// State history
// ------------------------------

var historyProto = {}

historyProto.init = function(len) {
    this._history = []
    this._len = len
    this._current = 0
    for (var idx = 0; idx < len; idx++) {
        this._history.push('start')
    }
}

historyProto.update = function (state) {
    this._current = (this._current + 1) % this._len
    this._history[this._current] = state
}

historyProto.previous = function () {
    var pre = (this._current - 1 + this._len) % this._len
    return this._history[pre]
}

historyProto.current = function () {
    return this._history[this._current]
}

// ------------------------------
// Constructors
// ------------------------------

function _createStates(parent) {
    var states = {
        moving: G.create(movingProto),
        stationary: G.create(stationaryProto),
        nofix: G.create(nofixProto),
        start: G.create(nofixProto),
    }

    for (state in states) {
        states[state].duration = 0
        states[state].parent = parent
    }

    return states
}


function createController() {
    tracker = G.create(controlProto)
    tracker._state = 'start';
    tracker.tracking = false;
    tracker._track_id = 0;
    tracker._started = new Date();
    tracker._records = 0;
    tracker._distance = 0;
    tracker._speed = 0;
    tracker._bearing = 0;
    tracker._last_update = Date.now()
    tracker._minimum_moving_distance = 5.0;
    tracker._maximum_moving_distance = 100.0;

    tracker._state_data = _createStates(tracker)
    tracker._last_pos = {
        stamp: Date.now(),
        lat: 0.0,
        lon: 0.0,
        coord: function() {return P.QtPositioning.coordinate(this.lat, this.lon)},
    };
    tracker._storage = S.createController();
    tracker.formatter = F.createFormatter();
    tracker._history = G.create(historyProto)
    tracker._history.init(5)

    return tracker;
}
