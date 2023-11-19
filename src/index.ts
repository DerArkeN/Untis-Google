require('dotenv').config();

import Untis from './client';
import Logger from './logger';

const logger = new Logger('Runnable');

const run = async (client: Untis) => {
	await client.start();

	let args = process.argv.slice(2);
	if(args.includes('rewrite')) await client.rewrite();

	let interval = parseInt(process.env.INTERVAL_MINUTES || "30") * 60 * 1000;
	check_cycle(client);
	let intervalID = setInterval(async () => {
		check_cycle(client, intervalID);
	}, interval);
};

const check_cycle = async (client: Untis, intervalID?: NodeJS.Timeout) => {
	let running = false;
	if(running) return;
	running = true;

	let success = false;
	let retry = 0;
	while(!success) {
		try {
			let google_timetable = await client.get_timetable_from_google();
			let untis_timetable = await client.get_timetable_from_untis();

			if(google_timetable && untis_timetable) {
				await client.sync(google_timetable, untis_timetable);
			}

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
	const client = new Untis(process.env.SCHOOL!, process.env.WEBURL!, process.env.WEBUSER!, process.env.PASSWORD!);
	const classes = process.env.CLASSES!.split(", ");
	if(classes.length != 1 && classes[0] != '') client.set_classes(classes);
	if(process.env.RANGE_DAYS) client.set_range(parseInt(process.env.RANGE_DAYS));

	run(client);
})();
