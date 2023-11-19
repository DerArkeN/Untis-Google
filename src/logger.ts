import winston from 'winston';
import pushsafer from 'pushsafer-notifications';
const progress = require('cli-progress');

const file_logger = winston.createLogger({
	levels: winston.config.syslog.levels,
	format: winston.format.json(),
	transports: [
		new winston.transports.File({ filename: 'log/error.log', level: 'error' }),
		new winston.transports.File({ filename: 'log/all.log' })
	]
});

const push = new pushsafer({
	k: process.env.PUSHKEY!
});
const device = process.env.DEVICE;

export default class Logger {
	public readonly prefix: string;

	constructor(prefix: string) {
		this.prefix = prefix;
	}

	public info(message: string) {
		message = `${this.prefix}: ${message}`;
		console.log(message);
		file_logger.info(message, { time: `${new Date()}` });
	}

	public error(message: string) {
		message = `${this.prefix} Error: ${message}`;
		console.log(message);
		file_logger.error(message, { time: `${new Date()}` });
	}

	public create_bar(title: string): any {
		return new progress.SingleBar({
			format: `${this.prefix}: ${title} | {bar} | {percentage}% | {value}/{total} Events`,
			barCompleteChar: '\u2588',
			barIncompleteChar: '\u2591',
			hideCursor: true
		});
	}

	public push_cancellation(subject: any, start: Date) {
		if(process.env.PUSHENABLED != 'true') return;
		let day = ("0" + start.getDate()).slice(-2);
		let month = ("0" + (start.getMonth() + 1)).slice(-2);

		let date = `${day}.${month}.`;

		var msg = {
			t: `${subject} cancelled.`,
			m: `${subject} on ${date} cancelled`,
			i: '95',
			c: '#008b02',
			d: device
		};

		push.send(msg, () => { });
	}

	public push_crash() {
		if(process.env.PUSHENABLED != 'true') return;
		var msg = {
			t: `untisgoogle crashed.`,
			m: `Check logs.`,
			i: '5',
			c: '#FF0000',
			d: device
		};

		push.send(msg, () => { });
	}
}
