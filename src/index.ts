require('dotenv').config();

import Untis from './untis';
import logger from './logger';
import push from './pushsafer';

const run = async (client: Untis) => {
	await client.start();

	let args = process.argv.slice(2);
	if(args.includes('rewrite')) await client.rewrite();
	if(args.includes('update')) await client.update(new Date());

	let oldT = await client.getTimetable();

	let running = false;
	let intervalID = setInterval(async () => {
		if(running) return;
		running = true;

		let success = false;
		let retry = 0;
		while(!success) {
			try {
				var curT = await client.getTimetable();

				// Check if update occured
				if(JSON.stringify(oldT) !== JSON.stringify(curT)) {
					logger.info('Update received', { time: `${new Date()}` });
					console.log('Update received');
					await client.addNew(oldT, curT);
					await client.update(new Date());
					oldT = curT;
				}

				success = true;
				running = false;
			} catch(err: any) {
				if(retry > 10) {
					console.log(err);
					logger.error(err, { time: `${new Date()}` });
					running = false;
					clearInterval(intervalID);
					logger.info(`Stopped after ${retry} tries.`, { time: `${new Date()}` });
					console.log(`Stopped after ${retry} tries.`);
					push.sendCrash();
					break;
				}
				await wait_seconds(60);
				retry++;
			}
		}
	}, parseInt(process.env.INTERVAL_MINUTES || "30") * 60 * 1000);
};

const wait_seconds = (seconds: number) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

(async () => {
	const client = new Untis(process.env.SCHOOL!, process.env.WEBURL!, process.env.WEBUSER!, process.env.PASSWORD!);
	const classes = process.env.CLASSES!.split(", ");
	if(classes.length != 1 && classes[0] != '') client.set_classes(classes);

	run(client);
})();
