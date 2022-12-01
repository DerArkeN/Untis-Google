const untis = require('./untis.js');
const logger = require('./logger.js');
const google = require('./google.js');
const { parse, startOfDay } = require('date-fns');

let run = async() => {
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

		// Request 5 times max
		let success = false;
		let retry = 0;
		while(!success) {
			try {
				var curT = await untis.getTimetable();
				success = true;

				// Check if update occured
				if(JSON.stringify(oldT) !== JSON.stringify(curT)) {
					logger.info('Update received', {time: `${new Date()}`});
					console.log('Update received');
					// Add new events
					await untis.addNew(oldT, curT);
					// Update events
					await untis.update(new Date());
					// Update oldT to curT
					oldT = curT;
				}
			
				running = false;
			}catch(err) {
				if(retry > 5) {
					console.log(err);
					logger.error(err, {time: `${new Date()}`});
				}	
			}
		}
		
	}, 30 * 60 * 1000);
}

(async() => {
	run();
})();
