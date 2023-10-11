import push from 'pushsafer-notifications';
import logger from './logger';

const p = new push({
	k: process.env.PUSHKEY!
});

const device = process.env.DEVICE;

const sendCancellation = async (subject:any, start:Date) => {
	if (process.env.PUSHENABLED == 'true') {
		let day = ("0" + start.getDate()).slice(-2);
		let month = ("0" + (start.getMonth() + 1)).slice(-2);

		let date = `${day}.${month}.`

		var msg = {
			t: `${subject} cancelled.`,
			m: `${subject} on ${date} cancelled`,
			i: '95',
			c: '#008b02',
			d: device
		};

		p.send(msg, function(err, result) {
			if (err) {
				console.log(err);
				logger.error(err.message, { time: `${new Date()}` });
			}
		});
	}
	return;
}

const sendCrash = async () => {
	if (process.env.PUSHENABLED == 'true') {
		var msg = {
			t: `untisgoogle crashed.`,
			m: `Check logs.`,
			i: '5',
			c: '#FF0000',
			d: device
		};

		p.send(msg, function(err, result) {
			if (err) {
				console.log(err);
				logger.error(err.message, { time: `${new Date()}` });
			}
		});
	}
	return;
}

export default { sendCancellation, sendCrash };
