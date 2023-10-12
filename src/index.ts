import untis from './untis';
import logger from './logger';
import push from './pushsafer';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const run = async () => {
	console.log('Started untis-google.');

	let args = process.argv.slice(2);
	if(args.includes('rewrite')) await untis.rewrite();
	if(args.includes('update')) await untis.update(new Date());

	let oldT = await untis.getTimetable();

	let running = false;
	let intervalID = setInterval(async () => {
		if(running) return;
		if(!untis) return;
		running = true;

		let success = false;
		let retry = 0;
		while(!success) {
			try {
				var curT = await untis.getTimetable();

				// Check if update occured
				if(JSON.stringify(oldT) !== JSON.stringify(curT)) {
					logger.info('Update received', { time: `${new Date()}` });
					console.log('Update received');
					await untis.addNew(oldT, curT);
					await untis.update(new Date());
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
				await delay(10000);
				retry++;
			}
		}
	}, parseInt(process.env.INTERVAL_MINUTES || "30") * 60 * 1000);
};

(async () => {
	run();
})();
