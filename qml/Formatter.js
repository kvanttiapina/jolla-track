/*
    GPLv2 copyright here
*/

.import "./Global.js" as G
.import "./Storage.js" as S

var pads = ['', '0', '00', '000', '0000', '00000']

var ms_to_knots = 3600/1852

function padding(v, w) {

    w = typeof w !== 'undefined' ? w : 2

    var s = '' + v
    if (s.length < w) {
        return  pads[w - s.length] + s
    }
    return s
}

function format(x, wi, wf) {
    var dig = Math.floor(x)
    var dec = x - dig
    dec = Math.floor(Math.pow(10, wf) * dec + 0.5)
    return padding(dig, wi) + '.' + padding(dec, wf)
}

var formatProto = {}

formatProto.date_ISO8601_UTC = function (date) {
    if (typeof date === 'number') {
        date = new Date(date)
    }

    // 2014-07-25T08:43:46Z
    var dt = ''
    dt += date.getUTCFullYear() + '-'
    dt += padding(date.getUTCMonth() + 1) + '-'
    dt += padding(date.getUTCDate()) + 'T'
    dt += padding(date.getUTCHours()) + ':'
    dt += padding(date.getUTCMinutes()) + ':'
    dt += padding(date.getUTCSeconds()) + 'Z'

    return dt
}

formatProto.date = formatProto.date_ISO8601_UTC


formatProto.duration_HMS = function (msecs) {
    if (isNaN(msecs)) return 'NaN'
    // H..H:MM:SS
    var secs = Math.floor(msecs / 1000)
    var d = ':' + padding(secs % 60)
    var mins = Math.floor(secs / 60)
    d = ':' + padding(mins % 60) + d
    return padding(Math.floor(mins / 60)) + d
}

formatProto.duration = formatProto.duration_HMS

formatProto.distance_SI = function (m) {
    if (isNaN(m)) return 'NaN'
    if (m > 1000) return format(m/1000, 0, 3) + ' km'
    return '' + Math.floor(Math.abs(m) + 0.5) + ' m'
}

formatProto.distance = formatProto.distance_SI


formatProto.speed_SI = function (ms) {
    if (isNaN(ms)) return 'NaN'
    return format(ms, 0, 1) + ' m/s'
}

formatProto.speed_knots = function (ms) {
    if (isNaN(ms)) return 'NaN'
    return format(ms_to_knots * ms, 0, 1) + ' kn'
}

formatProto.speed = formatProto.speed_SI

formatProto.bearing_deg = function (b) {
    if (isNaN(b)) return 'NaN'
    var br = (Math.floor(b + 0.5) + 360) % 360
    return padding(br, 3) + '\u00B0'
}

formatProto.bearing = formatProto.bearing_deg

formatProto.position_nautical = function (c, s) {
    s = typeof s !== 'undefined' ? s : 'both'

    var latitude = 0
    var longitude = 0

    if (s === 'latitude') {
        latitude = c
    } else if (s === 'longitude') {
        longitude = c
    } else {
        latitude = c.latitude
        longitude = c.longitude
    }

    if (isNaN(latitude) || isNaN(longitude)) return 'NaP'
    // 50°03.500'S 025°48.000'E
    var lat_dir = 'N'
    if (latitude < 0) lat_dir = 'S'
    var lon_dir = 'E'
    if (longitude < 0) lon_dir = 'W'
    var lat = Math.abs(latitude)
    var lon = Math.abs(longitude)
    var lat_deg = padding(Math.floor(lat), 2)
    var lon_deg = padding(Math.floor(lon), 3)
    var lat_min = format(60 * (lat - Math.floor(lat)), 2, 3)
    var lon_min = format(60 * (lon - Math.floor(lon)), 2, 3)

    if (s === 'latitude') {
        return lat_deg + '\u00B0' + lat_min + "'" + lat_dir
    }

    if (s === 'longitude') {
        return lon_deg + '\u00B0' + lon_min + "'" + lon_dir
    }

    return lat_deg + '\u00B0' + lat_min + "'" + lat_dir + ' ' + lon_deg + '\u00B0' + lon_min + "'" + lon_dir
}

formatProto.position = formatProto.position_nautical

formatProto.targets = {
    'Date': {
        target: 'date',
        alternatives: {
            'ISO8601/UTC': "date_ISO8601_UTC"
        }
    },
    'Duration': {
        target: 'duration',
        alternatives: {
            'hh:mm:ss': "duration_HMS"
        }
    },
    'Distance': {
        target: 'distance',
        alternatives: {
            'Metric': "distance_SI"
        }
    },
    'Speed': {
        target: 'speed',
        alternatives: {
            'Metric': "speed_SI",
            'Nautical': "speed_knots",
        }
    },
    'Bearing': {
        target: 'bearing',
        alternatives: {
            'Degrees': "bearing_deg"
        }
    },
    'Position': {
        target: 'position',
        alternatives: {
            "Deg&Min": "position_nautical"
        }
    },
}

formatProto.initSettingsModel = function (model) {
    // {label: .., selected: .., choices: list}
    for (var label in this.targets) {
        var choices = []
        var selected = -1
        var target = this.targets[label].target
        var alts = this.targets[label].alternatives
        var idx = 0;
        for (var alt in alts) {
            choices.push({key: label, value: alt})
            if (this[target] === this[alts[alt]]) {
                selected = idx
            }
            idx += 1
        }

        model.append({'label': label, 'selected': selected, 'choices': choices})
    }
}

formatProto._updateFromStorage = function () {
    var settings = this._storage.settings()
    for (var key in settings) {
        if (key in this.targets) {
            var value = settings[key]
            var alts = this.targets[key].alternatives
            if (value in alts) {
                var target = this.targets[key].target
                this[target] = this[alts[value]]
            }
        }
    }
}

formatProto.set = function (key, value) {
    if (key in this.targets) {
        var alts = this.targets[key].alternatives
        if (value in alts) {
            var target = this.targets[key].target
            this[target] = this[alts[value]]
            this._storage.set(key, value)
        }
    }
}

function createFormatter() {
    var fmt = G.create(formatProto);
    fmt._storage = S.createController();
    fmt._updateFromStorage();
    return fmt;
}
