require('dotenv').config();

import Untis from './client';
import Logger from './logger';

const logger = new Logger('Runnable');

const run = async (client: Untis) => {
	try {
		await client.start();
	} catch(err: any) {
		return;
	}

	let args = process.argv.slice(2);
	if(args.includes('rewrite')) await client.rewrite();

	let interval = parseInt(process.env.INTERVAL_MINUTES || "30") * 60 * 1000;
	sync_cycle(client);
	let intervalID = setInterval(async () => {
		sync_cycle(client, intervalID);
	}, interval);
};

const sync_cycle = async (client: Untis, intervalID?: NodeJS.Timeout) => {
	let running = false;
	if(running) return;
	running = true;

	let success = false;
	let retry = 0;
	while(!success) {
		try {
			client.sync();

			success = true;
			running = false;
		} catch(err: any) {
			if(retry > 10) {
				logger.error(`check_cycle --> ${err}`);
				running = false;
				if(intervalID) clearInterval(intervalID);
				logger.info(`Stopped after ${retry} tries.`);
				logger.push_crash();
				break;
			}
			await wait_seconds(60);
			retry++;
		}
	}
};

const wait_seconds = (seconds: number) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

(async () => {
	const school_url = process.env.SCHOOLURL;
	const webuser = process.env.WEBUSER;
	const password = process.env.PASSWORD;
	if(!school_url) {
		logger.error('School URL not set.');
		return;
	}
	if(!webuser) {
		logger.error('Webuser not set.');
		return;
	}
	if(!password) {
		logger.error('Password not set.');
		return;
	}
	const url_parts = school_url.split('/');
	const weburl = url_parts[2];
	const school = url_parts[4].replace('?school=', '').replace('#', '').replace('+', ' ');

	const client = new Untis(school, weburl, webuser, password);

	const classes = process.env.CLASSES!.split(", ");
	if(classes.length != 1 && classes[0] != '') client.set_classes(classes);
	if(process.env.RANGE_DAYS) client.set_range(parseInt(process.env.RANGE_DAYS));

	run(client);
})();
