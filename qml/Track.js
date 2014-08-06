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
    this._track_id = this._storage.createTrack()
    this._last_update = Date.now()
    this._history.init()
}


controlProto.updateTrack = function(pos, valid) {
    if (!this.tracking) return
    var now = Date.now()
    if (!valid) {
        this._transition('nofix', now, pos);
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
    var moved = pos.coordinate.distanceTo(this._last_stored_pos.coord())
    if (moved < this._minimum_moving_distance || moved > this._maximum_moving_distance) {
        return
    }
    this._add_pos_common(pos)
    this._records += 1;
}

controlProto._add_first_pos = function(pos) {
    this._add_pos_common(pos)
    this._records = 1;

}

controlProto._add_pos_common = function(pos) {
    var v_alt = pos.altitudeValid ? pos.coordinate.altitude : false;
    var v_vacc = pos.verticalAccuracyValid ? pos.verticalAccuracy : false;
    this._storage.addPosition(this._track_id,
                  pos.timestamp,
                  pos.coordinate.latitude,
                  pos.coordinate.longitude,
                  v_alt,
                  pos.horizontalAccuracy,
                  v_vacc);

    this._last_stored_pos.stamp = pos.timestamp;
    this._last_stored_pos.lat = pos.coordinate.latitude;
    this._last_stored_pos.lon = pos.coordinate.longitude;

}

controlProto._check_pos = function(pos) {
    return pos.latitudeValid && pos.longitudeValid && pos.horizontalAccuracyValid;
}

controlProto._is_stationary = function(pos) {
    var curr_state = this._history.previous(0).state
    // console.log(curr_state)
    var oldest = this._history.previous(0)
    var hlen = this._history.length - 4
    for (var idx = 1; idx < hlen; idx++) {
        var prev = this._history.previous(idx)
        if (prev.state !== curr_state) {
            break
        }
        oldest = prev
    }
    if (oldest.state === 'moving' && idx < hlen) {
        oldest = this._history.previous(idx+1)
    }

    var moved = oldest.pos.coordinate.distanceTo(pos.coordinate)
    // console.log('' + 4*moved + ' / ' + idx)
    if (moved < pos.horizontalAccuracy / 4) return true
    return false
}

controlProto._update_moving = function(pos) {
    // TODO least squares fit
    var prev = this._history.previous(0).pos
    var dist = pos.coordinate.distanceTo(prev.coordinate);
    var duration = (pos.timestamp - prev.timestamp) / 1000;
    this._distance += dist;
    this._speed = dist / duration;
    this._bearing = prev.coordinate.azimuthTo(pos.coordinate);
}


controlProto._transition = function(to, tm, pos) {
    this._history.update(to, pos)
    this._state_data[this._state].duration += tm - this._last_update
    this._state = to
    this._last_update = tm
}


// ------------------------------
// states
// ------------------------------

var nofixProto = {}
nofixProto.execute = function(pos, now) {
    if (!this.parent._check_pos(pos)) {
        this.parent._transition('nofix', now, pos)
        return;
    }
    if (this.parent._records === 0) {
        this.parent._add_first_pos(pos)
    } else {
        this.parent._add_pos(pos);
    }
    this.parent._transition('stationary', now, pos);
}

var stationaryProto = {}
stationaryProto.execute = function(pos, now) {
    if (!this.parent._check_pos(pos)) {
        this.parent._transition('nofix', now, pos)
        return
    }
    if (this.parent._is_stationary(pos)) {
        this.parent._transition('stationary', now, pos)
        return
    }
    this.parent._update_moving(pos)
    this.parent._add_pos(pos)
    this.parent._transition('moving', now, pos)
}

var movingProto = {}
movingProto.execute = function(pos, now) {
    if (!this.parent._check_pos(pos)) {
        this.parent._transition('nofix', now, pos)
        return
    }
    if (this.parent._is_stationary(pos)) {
        this.parent._transition('stationary', now, pos)
        return
    }
    this.parent._update_moving(pos);
    this.parent._add_pos(pos)
    this.parent._transition('moving', now, pos);
}


// ------------------------------
// State history
// ------------------------------

var historyProto = {}

historyProto.init = function() {
    this._history = []
    this.length = 10
    this._current = 0
    for (var idx = 0; idx < this.length; idx++) {
        this._history.push({state: 'start', pos: {timestamp: 0, coordinate: P.QtPositioning.coordinate(0,0)}})
    }
}

historyProto.update = function (state, pos) {
    this._current = (this._current + 1) % this.length
    this._history[this._current].state = state
    this._history[this._current].pos.timestamp = pos.timestamp
    this._history[this._current].pos.coordinate = P.QtPositioning.coordinate(pos.coordinate.latitude,
                                                                             pos.coordinate.longitude)
}

historyProto.previous = function (idx) {
    var pre = (this._current - idx + this.length) % this.length
    return this._history[pre]
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
    tracker._state = 'start'
    tracker.tracking = false
    tracker._track_id = 0
    tracker._started = new Date()
    tracker._records = 0
    tracker._distance = 0
    tracker._speed = 0
    tracker._bearing = 0
    tracker._last_update = Date.now()
    tracker._minimum_moving_distance = 5.0
    tracker._maximum_moving_distance = 100.0

    tracker._state_data = _createStates(tracker)
    tracker._last_stored_pos = {
        stamp: Date.now(),
        lat: 0.0,
        lon: 0.0,
        coord: function() {return P.QtPositioning.coordinate(this.lat, this.lon)},
    }
    tracker._storage = S.createController()
    tracker.formatter = F.createFormatter()
    tracker._history = G.create(historyProto)
    tracker._history.init()

    return tracker
}
