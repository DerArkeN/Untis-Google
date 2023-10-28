import { google } from 'googleapis';
import logger from './logger';
require('dotenv').config();

// Check if there is a better way to configure this then putting
// json in a env variable
const CREDENTIALS = JSON.parse(process.env.CREDS!);
const calendarId = process.env.CALENDAR_ID;

const SCOPES = 'https://www.googleapis.com/auth/calendar';
const calendar = google.calendar({ version: 'v3' });

const auth = new google.auth.JWT(
	CREDENTIALS.client_email,
	undefined,
	CREDENTIALS.private_key,
	SCOPES
);

const insertEvent = async (eventId: number, subject: string, room: string, teacher: string, colorId: string, start: Date, end: Date) => {
	try {
		await calendar.events.insert({
			auth: auth,
			calendarId: calendarId,
			requestBody: {
				'id': String(eventId),
				'summary': subject,
				'colorId': colorId,
				'location': `${room}/${teacher}`,
				'start': {
					'dateTime': start.toISOString(),
					'timeZone': 'Europe/Berlin'
				},
				'end': {
					'dateTime': end.toISOString(),
					'timeZone': 'Europe/Berlin'
				}
			}
		});
	} catch(err: any) {
		if(err.message == 'The requested identifier already exists.') {
			await update(eventId, subject, room, teacher, colorId, start, end);
		} else {
			console.log(`Error at insertEvent --> ${err}`);
			logger.error(err, { time: `${new Date()}` });
		}
	}
};

const update = async (eventId: number, subject: string, room: string, teacher: string, colorId: string, start: Date, end: Date) => {
	try {
		await calendar.events.update({
			auth: auth,
			calendarId: calendarId,
			eventId: String(eventId),
			requestBody: {
				'summary': subject,
				'colorId': colorId,
				'location': `${room}/${teacher}`,
				'start': {
					'dateTime': start.toISOString(),
					'timeZone': 'Europe/Berlin'
				},
				'end': {
					'dateTime': end.toISOString(),
					'timeZone': 'Europe/Berlin'
				}
			}
		});
	} catch(err: any) {
		console.log(`Error at update --> ${err}`);
		logger.error(err, { time: `${new Date()}` });
	}
};

const getEventsMin = async (dateTimeStart: Date | string) => {
	if(typeof (dateTimeStart) !== 'string') dateTimeStart = dateTimeStart.toISOString();
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
	} catch(err: any) {
		console.log(`Error at getEvents --> ${err}`);
		logger.error(err, { time: `${new Date()}` });
	}
};

const deleteEvent = async (eventId: string) => {
	try {
		await calendar.events.delete({
			auth: auth,
			calendarId: calendarId,
			eventId: eventId
		});
	} catch(err: any) {
		console.log(`Error at deleteEvent --> ${err}`);
		logger.error(err, { time: `${new Date()}` });
		return 0;
	}
};

const deleteAllEventsFromToday = async () => {
	let i = 0;
	try {
		let events = await getEventsMin(new Date());
		if(!events) return;
		let events_length = events.length;
		for(const event of events) {
			await deleteEvent(event.id!);
			i += 1;
			process.stdout.write(`Deleted event ${event.id} (${i}/${events_length}).\r`);
		}
		console.log('');
	} catch(err: any) {
		console.log(err);
		logger.error(err, { time: `${new Date()}` });
	}
};

export default { insertEvent, getEventsMin, update, deleteEvent, deleteAllEventsFromToday };
