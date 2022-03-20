const untis = require('./untis.js');
const logger = require('./logger.js');
const google = require('./google.js');
const { parse, startOfDay } = require('date-fns');

(async () => {
	console.log('Started untis-google.');

	let args = process.argv.slice(2);
	if(args[0] == 'rewrite') untis.rewrite();

	await untis.update();

	let oldT = await untis.getTimetable();

	let events = await google.getEvents();
	let lastEvent = events[events.length-1];
	let oldDate = new Date(lastEvent.start.dateTime);

	let running = false;
		setInterval(async() => {
			if(running) return;
			running = true;
			let curT = await untis.getTimetable();

			let newDate = parse(`${curT[curT.length-1].date}`, 'yyyyMMdd', startOfDay(new Date()));

			//Check if update occured
			if(JSON.stringify(oldT) !== JSON.stringify(curT)) {
				logger.info('Update received', {time: `${new Date()}`});
				console.log('Update received');
				//Update events
				await untis.update(new Date());
				//Check if new update got new events and add them in case
				if(oldDate < newDate) await untis.addNew(oldT, curT);
				//Update oldT to curT
				oldT = curT;
			}

			running = false;
	}, 60 * 60 * 1000);
})();
