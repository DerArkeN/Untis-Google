require('dotenv').config();

import Untis from './untis';
import push from './pushsafer';

const run = async (client: Untis) => {
	await client.start();

	let args = process.argv.slice(2);
	if(args.includes('rewrite')) await client.rewrite();
	if(args.includes('update')) await client.update();

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
					client.log('Update received');
					await client.addNew(oldT, curT);
					await client.update();
					oldT = curT;
				}

				success = true;
				running = false;
			} catch(err: any) {
				if(retry > 10) {
					client.log(`run --> ${err}`, 'error');
					running = false;
					clearInterval(intervalID);
					client.log(`Stopped after ${retry} tries.`);
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
	client.set_range(parseInt(process.env.RANGE_DAYS!));

	run(client);
})();
