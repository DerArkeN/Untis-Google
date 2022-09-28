const untis = require('./untis.js');
const logger = require('./logger.js');
const google = require('./google.js');
const { parse, startOfDay } = require('date-fns');

(async () => {
	console.log('Started untis-google.');

	let args = process.argv.slice(2);
	if(args[0] == 'rewrite') await untis.rewrite();
	if(args[0] == 'update') await untis.update(new Date());

	let oldT = await untis.getTimetable();

	let running = false;
	intervalID = setInterval(async() => {
		if(running) return;
		if(untis == null) return;
		running = true;
		try {
			var curT = await untis.getTimetable();
		}catch(err) {
			logger.error(err, {time: `${new Date()}`});
			running = false;
			return;
		}
	
		//Check if update occured
		if(JSON.stringify(oldT) !== JSON.stringify(curT)) {
			logger.info('Update received', {time: `${new Date()}`});
			console.log('Update received');
			//Add new events
			await untis.addNew(oldT, curT);
			//Update events
			await untis.update(new Date());
			//Update oldT to curT
			oldT = curT;
		}
	
		running = false;
	}, 30 * 60 * 1000);
})();