const { startOfDay, endOfDay } = require('date-fns');
const {google} = require('googleapis');
const logger = require('./logger');
require('dotenv').config();

const CREDENTIALS = JSON.parse(process.env.CREDS);
const calendarId = process.env.CALENDAR_ID;

const SCOPES = 'https://www.googleapis.com/auth/calendar';
const calendar = google.calendar({version : 'v3'});

const auth = new google.auth.JWT(
	CREDENTIALS.client_email,
	null,
	CREDENTIALS.private_key,
	SCOPES
);

module.exports.insertEvent = async(eventId, subject, room, teacher, colorId, start, end) => {
	try {
		let response = await calendar.events.insert({
			auth: auth,
			calendarId: calendarId,
			eventId: eventId,
			resource: {
				'summary': `${subject}`,
				'colorId': `${colorId}`,
				'id': `${eventId}`,
				'location': `${room}/${teacher}`,
				'start': {
					'dateTime': start,
					'timeZone': 'Europe/Berlin'
				},
				'end': {
					'dateTime': end,
					'timeZone': 'Europe/Berlin'
				}
			}
		});
	}catch(err) {
		if(err.message == 'Error: The requested identifier already exists.') {
			await this.update(eventId, subject, room, teacher, colorId, start, end);
		}else {
			console.log(`Error at insertEvent --> ${err}`);
			logger.error(err, {time: `${new Date()}`});
		}
	}
};

module.exports.getEventsMin = async(dateTimeStart) => {
	if(typeof(dateTimeStart) == Date) dateTimeStart.toISOString();
	try {
		let response = await calendar.events.list({
			auth: auth,
			calendarId: calendarId,
			singleEvents: true,
			maxResults: 1000,
			timeMin: dateTimeStart,
			orderBy: 'startTime',
			timeZone: 'Europe/Berlin'
		});
    
		let items = response['data']['items'];
		return items;
	} catch(err) {
		console.log(`Error at getEvents --> ${err}`);
		logger.error(err, {time: `${new Date()}`});
	}
};

module.exports.update = async(eventId, subject, room, teacher, colorId, start, end) => {
	try{
		await calendar.events.update({
			auth: auth,
			calendarId: calendarId,
			eventId: eventId,
			resource: {
				'summary': `${subject}`,
				'colorId': `${colorId}`,
				'id': `${eventId}`,
				'location': `${room}/${teacher}`,
				'start': {
					'dateTime': start,
					'timeZone': 'Europe/Berlin'
				},
				'end': {
					'dateTime': end,
					'timeZone': 'Europe/Berlin'
				}
			}
		});
	}catch(err) {
		console.log(`Error at update --> ${err}`);
		logger.error(err, {time: `${new Date()}`});
	}
};

module.exports.deleteEvent = async (eventId) => {
	try {
		let response = await calendar.events.delete({
			auth: auth,
			calendarId: calendarId,
			eventId: eventId
		});
	} catch(err) {
		console.log(`Error at deleteEvent --> ${err}`);
		logger.error(err, {time: `${new Date()}`});
		return 0;
	}
};

module.exports.deleteAllEventsFromToday = async () => {
	let i = 0;
	try{
		let events = await this.getEventsMin(new Date());
		for(const val of events) {
			await this.deleteEvent(val.id);
			i += 1;
			process.stdout.write(`Deleted ${i} events.\r`);
		}
		console.log('');
	}catch(err) {
		console.log(err);
		logger.error(err, {time: `${new Date()}`});
	}
};