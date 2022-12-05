const push = require('pushsafer-notifications' );
const logger = require('./logger');

const p = new push( {
	k: process.env.PUSHKEY
});

const device=process.env.DEVICE;

module.exports.sendCancellation = async(subject, start) => {
	if(process.env.PUSHENABLED == 'true') {
		let day=("0" + start.getDate()).slice(-2);
		let month=("0" + (start.getMonth() + 1)).slice(-2);
	
		let date = `${day}.${month}.`
	
		var msg = {
			t: `${subject} cancelled.`,
			m: `${subject} on ${date} cancelled`,
			i: '95',
			c: '#008b02',
			d: device
		};
	
		p.send(msg, function(err, result) {
			if(err){
				console.log(err);
				logger.error(err, {time: `${new Date()}`});
			}
		});
	}
	return;
}

module.exports.sendTasks = async(subject, start, substText) => {
	if(process.env.PUSHENABLED == 'true') {		
		let day=("0" + start.getDate()).slice(-2);
		let month=("0" + (start.getMonth() + 1)).slice(-2);
	
		let date = `${day}.${month}.`
	
		var msg = {
			t: `Tasks in ${subject}.`,
			m: `${substText}`,
			i: '4',
			c: '#fccb00',
			d: device
		};
	
		p.send(msg, function(err, result) {
			if(err){
				console.log(err);
				logger.error(err, {time: `${new Date()}`});
			}
		});
	}
	return;
}

module.exports.sendCrash = async() => {
	if(process.env.PUSHENABLED == 'true') {
		var msg = {
			t: `untisgoogle crashed.`,
			m: `Check logs.`,
			i: '5',
			c: '#FF0000',
			d: device
		};
	
		p.send(msg, function(err, result) {
			if(err){
				console.log(err);
				logger.error(err, {time: `${new Date()}`});
			}
		});
	}
	return;
}
