require('dotenv').config();

const { parse, startOfDay } = require('date-fns');
const WebUntis = require('webuntis');
const google = require('./google');
const logger = require('./logger');

const untisAPI = new WebUntis(process.env.SCHOOL, process.env.WEBUSER, process.env.PASSWORD, process.env.WEBURL);

const classes = ['geo3', 'g2', 'M2', 'Mu1', 'ch1', 'eth2', 'bio2', 'inf1', 'gk3', 'E1', 'd2', 's3'];

module.exports.validateSession = async () => {
  return await untisAPI.validateSession();
}

module.exports.getTimetableForToday = async () => {
	try {
		await untisAPI.login();
        
		let timetable = await untisAPI.getOwnClassTimetableForToday();

		let cTimetable = [];

		for(const val of timetable) {
			let subj = val.su[0];
			if(subj) {
				if(classes.includes(subj.name)) {
					cTimetable.push(val);
				}
			}
		}

		await untisAPI.logout();
		cTimetable.sort((a, b) => a.startTime - b.starTime);
		return cTimetable;
	}catch(err) {
		console.log(err);
		logger.error(err, {time: `${new Date()}`});
	}
};

module.exports.getTimetableFor = async (date) => {
	try {
		await untisAPI.login();
        
		let timetable = await untisAPI.getOwnClassTimetableFor(date);

		let cTimetable = [];

		for(const val of timetable) {
			let subj = val.su[0];
			if(subj) {
				if(classes.includes(subj.name)) {
					cTimetable.push(val);
				}
			}
		}

		await untisAPI.logout();
		cTimetable.sort((a, b) => a.startTime - b.starTime);
		return cTimetable;
	}catch(err) {
		console.log(err);
		logger.error(err, {time: `${new Date()}`});
	}
};

module.exports.getTimetable = async() => {
	try{
		await untisAPI.login();

		let date = new Date();
		let cTimetable = [];

		// eslint-disable-next-line no-constant-condition
		while(true) {
			try{
				let timetable = await untisAPI.getOwnClassTimetableFor(date);
                
				for(const val of timetable) {
					let subj = val.su[0];
					if(subj) {
						if(classes.includes(subj.name)) {
							cTimetable.push(val);
						}
					}
				}
    
				date.setDate(date.getDate() + 1);
			}catch(err) {
				if(err.message == 'Server didn\'t returned any result.') {
					break;
				}else {
					console.log(err);
					logger.error(err, {time: `${new Date()}`});
					break;
				}
			}finally {
				process.stdout.write(`Gathered ${cTimetable.length} timetables.\r`);
			}
		}

		logger.info(`Gathered ${cTimetable.length} timetables.`, {time: `${new Date()}`});
		console.log('');

		await untisAPI.logout();
		cTimetable.sort((a, b) => a.startTime - b.starTime);
		return cTimetable;
	}catch(err) {
		console.log(err);
		logger.error(err, {time: `${new Date()}`});
	}
};

module.exports.convertAndInsertTimetable = async(cTimetable) => {
	let i = 0;
	try {
		for(const lesson of cTimetable) {
			let date = lesson.date;
			let startTime = lesson.startTime;
			let endTime = lesson.endTime;
			let subject = lesson.su[0].longname;
			let room = lesson.ro[0].name;
			let teacher = lesson.te[0].longname;

			let start = parse(`${date}${startTime}`, 'yyyyMMddHmm', startOfDay(new Date()));
			let end = parse(`${date}${endTime}`, 'yyyyMMddHmm', startOfDay(new Date()));

			let colorId = 2;

			if(lesson.code) {
				if(lesson.code == 'cancelled') {
					colorId = 4;
				}
			}

			var event = {
				'summary': `${subject}`,
				'description': `${room}/${teacher}`,
				'colorId': `${colorId}`,
				'start': {
					'dateTime': start,
					'timeZone': 'Europe/Berlin'
				},
				'end': {
					'dateTime': end,
					'timeZone': 'Europe/Berlin'
				}
			};
            
			await google.insertEvent(event);

			i += 1;

			process.stdout.write(`Inserted ${i} events.\r`);
			logger.info(`Inserted ${subject} on ${start}`, {time: `${new Date()}`});
		}
		console.log('');
	}catch(err) {
		console.log(err);
		logger.error(err, {time: `${new Date()}`});
	}
};

module.exports.rewrite = async () => {
	await google.deleteAllEventsFromToday();

	let timetable = await this.getTimetable();
	await this.convertAndInsertTimetable(timetable);
};

module.exports.update = async(date) => {
	let events = await google.getEventsMin(date);    
	let i = 0;
	for(const event of events) {
		let eventId = event.id;
		let description = event.description.split('/');
		let subject = event.summary;
		let room = description[0];
		let teacher = description[1];
		let colorId = event.colorId;
		let start = new Date(event.start.dateTime);
		let end = new Date(event.end.dateTime);

		let lessons = await this.getTimetableFor(start);
		let lesson = lessons.find(e => e.startTime == convertDateToUntisTime(start) && e.date == convertDateToUntisDate(start));

		if(lesson) {
			let subject1 = lesson.su[0].longname;
			let room1 = lesson.ro[0].name;
			let teacher1 = lesson.te[0].longname;

			let colorId1 = 2;
			if(lesson.code) {
				if(lesson.code == 'cancelled') {
					colorId1 = 4;
				}
			}

			if(!(room == room1) || !(teacher == teacher1) || !(colorId == colorId1) || !(subject == subject1)){
				console.log(`Updated: ${subject} on ${start}.`);
				logger.info(`Updated: ${subject} on ${start}.`, {time: `${new Date()}`});
				google.update(eventId, subject1, room1, teacher1, colorId1, start, end);
			}

			i++;
			process.stdout.write(`Checked ${i}/${events.length} events\r`);
		}
	}
	console.log('');
	logger.info('Updated all events', {time: `${new Date()}`});
	console.log('Updated all events');
};

module.exports.addNew = async(oldT, curT) => {
	logger.info('New events received', {time: `${new Date()}`});

	let cur1 = [];
	let old1 = [];
	let newEvents = [];

	for(const event of oldT) {
		old1.push(event.id);
	}
	for(const event of curT) {
		cur1.push(event.id);
	}

	let ids = cur1.filter(x => !old1.includes(x));

	for(const id of ids) {
		let event = curT.find(x => x.id == id);
		newEvents.push(event);
	}

	await this.convertAndInsertTimetable(newEvents);
	logger.info('New events added', {time: `${new Date()}`});
};

function convertDateToUntisDate(date) {
	return (
		date.getFullYear().toString() +
        (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1).toString() +
        (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()).toString()
	);
}

function convertDateToUntisTime(date) {
	return (
		date.getHours().toString() + date.getMinutes().toString()
	);
}
