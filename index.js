const untis = require('./untis');
const logger = require('./logger');
const { parse, startOfDay } = require('date-fns');

(async () => {
	console.log('Started untis-google.');

	let oldT = await untis.getTimetable();
	let oldDate = parse(`${oldT[oldT.length-1].date}`, 'yyyyMMdd', startOfDay(new Date()));
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
			await untis.update();
			//Check if new update got new events and add them in case
			if(oldT < newDate) await untis.addNew(oldT, curT);
			//Update oldT to curT
			oldT = curT;
		}

		running = false;
	}, 60 * 60 * 1000);
})();