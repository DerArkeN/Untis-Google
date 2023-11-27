import winston from 'winston';
import pushsafer from 'pushsafer-notifications';
import config from '../user/config.json';
const progress = require('cli-progress');

const file_logger = winston.createLogger({
	levels: winston.config.syslog.levels,
	format: winston.format.json(),
	transports: [
		new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
		new winston.transports.File({ filename: 'logs/all.log' })
	]
});

const push = new pushsafer({
	k: config.pushsafer.key
});
const device = config.pushsafer.device;

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

	public push_cancellation(subject: any, date_string: String) {
		if(config.pushsafer.enabled != true) return;
		var msg = {
			t: `${subject} cancelled.`,
			m: `${subject} on ${date_string} cancelled`,
			i: '95',
			c: '#008b02',
			d: device
		};

		push.send(msg, () => { });
	}

	public push_crash() {
		if(config.pushsafer.enabled != true) return;
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
