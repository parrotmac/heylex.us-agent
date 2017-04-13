//var socket = require('socket.io-client')('http://isaacparker.co:3030');
//var socket = require('socket.io-client')('http://192.168.86.38:8300');
var socket = require('socket.io-client')('http://heylex.us:8300');
var rpio = require('rpio');

var SERVICE_MODE = true;

const PIN_REMOTE_START = 12;
const PIN_UNLOCK = 16;
const PIN_LOCK = 18;

rpio.open(PIN_REMOTE_START, rpio.OUTPUT); // RS Trigger
rpio.open(PIN_UNLOCK, rpio.OUTPUT); // Unlock rpio.open(PIN_LOCK, rpio.OUTPUT); // Lock

socket.on('connect', function(){
	console.log("Connected");
});


socket.on('disconnect', function(){
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
	if(typeof(duration) !== 'undefined') {
		pulseDuration = duration;
	}
	rpio.write(pin, rpio.HIGH);
	rpio.msleep(pulseDuration);
	rpio.write(pin, rpio.LOW);
}

var commandHistory = {};

socket.on('lex-command', function incoming(actionMessage) {
    console.log('GPIO Command: %s', actionMessage);

	commandHistory[actionMessage] ? commandHistory[actionMessage]+=1 : commandHistory[actionMessage] = 1;

    if(actionMessage === "remote-start:engine:on" || actionMessage === "remote-start:engine:off") {
		if(SERVICE_MODE) {
			returnError(actionMessage, 'service-mode-enabled')
			return
		}
        pulsePin(PIN_REMOTE_START);
		confirmAction(actionMessage, commandHistory[actionMessage]);
    }
	
    if(actionMessage === "remote-start:security:unlock") {
		if(SERVICE_MODE) {
			returnError(actionMessage, 'service-mode-enabled')
			return
		}
        pulsePin(PIN_UNLOCK);
		confirmAction(actionMessage, commandHistory[actionMessage]);
	}
	
    if(actionMessage === "remote-start:security:lock") {
		if(SERVICE_MODE) {
			returnError(actionMessage, 'service-mode-enabled')
			return
		}
        pulsePin(PIN_LOCK);
		confirmAction(actionMessage, commandHistory[actionMessage]);
	}
	
});
