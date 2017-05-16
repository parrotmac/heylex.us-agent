//var socket = require('socket.io-client')('http://isaacparker.co:3030');
//var socket = require('socket.io-client')('http://192.168.86.38:8300');
var socket = require('socket.io-client')('http://heylex.us:8300');
var rpio = require('rpio');

// TODO: Pull this from somewhere
var SERVICE_MODE = false;

const PIN_REMOTE_START = 12;
const PIN_UNLOCK = 16;
const PIN_LOCK = 18;
const PIN_TRUNK = 22;
const PIN_PARKING_LIGHTS = 40;
const PIN_HORN = 38;

rpio.open(PIN_REMOTE_START, rpio.OUTPUT); // RS Trigger
rpio.open(PIN_UNLOCK, rpio.OUTPUT); // Unlock
rpio.open(PIN_LOCK, rpio.OUTPUT); // Lock
rpio.open(PIN_TRUNK, rpio.OUTPUT); // Trunk
rpio.open(PIN_PARKING_LIGHTS, rpio.OUTPUT); // Parking lights
rpio.open(PIN_HORN, rpio.OUTPUT); // Horn

socket.on('connect', function () {
	console.log("Connected");
});


socket.on('disconnect', function () {
	console.log("Disconnected");
});

function confirmAction(action, eventId) {
	socket.emit('lex-confirm', {
		action: action,
		eventId: eventId
	});
}

function returnError(requestedAction, reason) {
	socket.emit("lex-error", {
		"requestedAction": requestedAction,
		"reason": reason
	});
}

function pulsePin(pin, duration) {
	var pulseDuration = 500;
	if (typeof (duration) !== 'undefined') {
		pulseDuration = duration;
	}
	rpio.write(pin, rpio.HIGH);
	rpio.msleep(pulseDuration);
	rpio.write(pin, rpio.LOW);
}

var commandHistory = {};


socket.on('lex-meta-request', function incoming(metaRequest) {
	switch(metaRequest) {
		case "ping":
		socket.emit("lext-meta-response", {
			type: "ping",
			time: new Date()
		});
		break;
	}
});

socket.on('lex-command', function incoming(actionMessage) {
	console.log('GPIO Command: %s', actionMessage);

	commandHistory[actionMessage] ? commandHistory[actionMessage] += 1 : commandHistory[actionMessage] = 1;

	if (actionMessage === "remote-start:engine:on" || actionMessage === "remote-start:engine:off") {
		if (SERVICE_MODE) {
			returnError(actionMessage, 'service-mode-enabled')
			return
		}
		pulsePin(PIN_PARKING_LIGHTS);
		pulsePin(PIN_REMOTE_START);
		confirmAction(actionMessage, commandHistory[actionMessage]);
	}

	if (actionMessage === "remote-start:fast-honk") {
		const honkDuration = 50;
		const honkCount = 5;

		for(var i = 0; i < honkCount; i++) {
			rpio.write(PIN_HORN, rpio.HIGH);
			rpio.msleep(honkDuration);
			rpio.write(PIN_HORN, rpio.LOW);
			rpio.msleep(honkDuration);
		}

		var isOn = false;
		var honks = 0;
		var fastHonkInterval = setInterval(function() {
			if(isOn) {
				rpio.write(PIN_HORN, rpio.LOW);
				isOn = false;
				if(honks > 9) {
					clearInterval(fastHonkInterval);
				}
			} else {
				rpio.write(PIN_HORN, rpio.HIGH);
				isOn = true;
				honks++;
			}
			
		}, 25);

		// Ensure we don't accidentally leave the horn on
		rpio.write(PIN_HORN, rpio.LOW);

		confirmAction(actionMessage, commandHistory[actionMessage]);
	}

	if (actionMessage === "remote-start:security:unlock") {
		if (SERVICE_MODE) {
			returnError(actionMessage, 'service-mode-enabled')
			return
		}
		pulsePin(PIN_UNLOCK);
		pulsePin(PIN_PARKING_LIGHTS);
		confirmAction(actionMessage, commandHistory[actionMessage]);
	}

	if (actionMessage === "remote-start:security:lock") {
		if (SERVICE_MODE) {
			returnError(actionMessage, 'service-mode-enabled')
			return
		}
		pulsePin(PIN_LOCK);
		pulsePin(PIN_PARKING_LIGHTS);
		confirmAction(actionMessage, commandHistory[actionMessage]);
	}

	if (actionMessage === "remote-start:security:trunk") {
		if (SERVICE_MODE) {
			returnError(actionMessage, 'service-mode-enabled')
			return
		}
		pulsePin(PIN_TRUNK);
		pulsePin(PIN_PARKING_LIGHTS);
		confirmAction(actionMessage, commandHistory[actionMessage]);
	}

});