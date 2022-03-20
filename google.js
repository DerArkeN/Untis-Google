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

module.exports.insertEvent = async (event) => {
	try {
		let response = await calendar.events.insert({
			auth: auth,
			calendarId: calendarId,
			resource: event
		});
	}catch(err) {
		console.log(`Error at insertEvent --> ${err}`);
		logger.error(err, {time: `${new Date()}`});
	}
};

module.exports.getEvents = async (dateTimeStart, dateTimeEnd) => {
	if(typeof(dateTimeStart) == Date) dateTimeStart.toISOString();
	if(typeof(dateTimeEnd) == Date) dateTimeEnd.toISOString();
	try {
		let response = await calendar.events.list({
			auth: auth,
			calendarId: calendarId,
			maxResults: 1000,
			singleEvents: true,
			orderBy: 'startTime',
			timeMin: dateTimeStart,
			timeMax: dateTimeEnd,
			timeZone: 'Europe/Berlin'
		});  
		let items = response['data']['items'];
		return items;
	} catch(err) {
		console.log(`Error at getEvents --> ${err}`);
		logger.error(err, {time: `${new Date()}`});
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

module.exports.getEvents = async () => {
	try {
		let response = await calendar.events.list({
			auth: auth,
			calendarId: calendarId,
			singleEvents: true,
			maxResults: 1000,
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

module.exports.getEventsFromDay = async (day) => {
	day = startOfDay(day);
	let end = endOfDay(day);
	day.toISOString();
	end.toISOString();
	try {
		let response = await calendar.events.list({
			auth: auth,
			calendarId: calendarId,
			singleEvents: true,
			timeMin: day,
			timeMax: end,
			timeZone: 'Europe/Berlin'
		});
    
		let items = response['data']['items'];
		return items;
	} catch(err) {
		console.log(`Error at getEvents --> ${err}`);
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

module.exports.update = async (eventId, subject, room, teacher, colorId, start, end) => {
	try{
		await calendar.events.update({
			auth: auth,
			calendarId: calendarId,
			eventId: eventId,
			resource: {
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
			}
		});
	}catch(err) {
		console.log(`Error at update --> ${err}`);
		logger.error(err, {time: `${new Date()}`});
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