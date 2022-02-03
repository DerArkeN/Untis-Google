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

const TIMEOFFSET = '+00:00';

module.exports.dateTimeForCalander = () => {

	let date = new Date();

	let year = date.getFullYear();
	let month = date.getMonth() + 1;
	if (month < 10) {
		month = `0${month}`;
	}
	let day = date.getDate();
	if (day < 10) {
		day = `0${day}`;
	}
	let hour = date.getHours();
	if (hour < 10) {
		hour = `0${hour}`;
	}
	let minute = date.getMinutes();
	if (minute < 10) {
		minute = `0${minute}`;
	}

	let newDateTime = `${year}-${month}-${day}T${hour}:${minute}:00.000${TIMEOFFSET}`;

	let event = new Date(Date.parse(newDateTime));

	let startDate = event;
	let endDate = new Date(new Date(startDate).setHours(startDate.getHours()+1));

	return {
		'start': startDate,
		'end': endDate
	};
};

module.exports.insertEvent = async (event) => {
	try {
		let response = await calendar.events.insert({
			auth: auth,
			calendarId: calendarId,
			resource: event
		});
    
		if (response['status'] == 200 && response['statusText'] === 'OK') {
			return 1;
		} else {
			return 0;
		}
	}catch(err) {
		console.log(`Error at insertEvent --> ${err}`);
		logger.error(err, {time: `${new Date()}`});
		return 0;
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
		return 0;
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
		return 0;
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
		return 0;
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
		return 0;
	}
};

module.exports.deleteEvent = async (eventId) => {
	try {
		let response = await calendar.events.delete({
			auth: auth,
			calendarId: calendarId,
			eventId: eventId
		});

		if (response.data === '') {
			return 1;
		} else {
			return 0;
		}
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
		return 0;
	}
};

module.exports.deleteAllEventsFromToday = async () => {
	let i = 0;
	let today = new Date();
	try{
		let events = await this.getEventsMin(today);
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