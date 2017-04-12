//var socket = require('socket.io-client')('http://isaacparker.co:3030');
//var socket = require('socket.io-client')('http://192.168.86.38:8300');
var socket = require('socket.io-client')('http://heylex.us:8300');
var rpio = require('rpio');

const PIN_REMOTE_START = 12;
const PIN_UNLOCK = 16;
const PIN_LOCK = 18;

rpio.open(PIN_REMOTE_START, rpio.OUTPUT); // RS Trigger
rpio.open(PIN_UNLOCK, rpio.OUTPUT); // Unlock
rpio.open(PIN_LOCK, rpio.OUTPUT); // Lock

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

socket.on('lex-command', function incoming(message) {
    console.log('GPIO Command: %s', message);

	commandHistory[message] ? commandHistory[message]+=1 : commandHistory[message] = 1;

    if(message === "remote-start:engine:on" || message === "remote-start:engine:off") {
        pulsePin(PIN_REMOTE_START);
		confirmAction(message, commandHistory[message]);
	}
	
    if(message === "remote-start:security:unlock") {
        pulsePin(PIN_UNLOCK);
		confirmAction(message, commandHistory[message]);
	}
	
    if(message === "remote-start:security:lock") {
        pulsePin(PIN_LOCK);
		confirmAction(message, commandHistory[message]);
	}
	
});
