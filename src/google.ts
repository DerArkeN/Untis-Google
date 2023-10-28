import { calendar_v3, google } from 'googleapis';
import logger from './logger';
require('dotenv').config();
const progress = require('cli-progress');

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

const getEvents = async (rangeStart: Date, rangeEnd: Date | undefined = undefined): Promise<calendar_v3.Schema$Event[] | undefined> => {
	try {
		let response = await calendar.events.list({
			auth: auth,
			calendarId: calendarId,
			singleEvents: true,
			maxResults: 1000,
			timeMin: rangeStart.toISOString(),
			timeMax: rangeEnd ? rangeEnd.toISOString() : undefined,
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

const deleteAllEvents = async () => {
	let i = 0;
	const bar = new progress.SingleBar({
		format: 'Google: Deleting | {bar} | {percentage}% | {value}/{total} Events',
		barCompleteChar: '\u2588',
		barIncompleteChar: '\u2591',
		hideCursor: true
	});
	try {
		let events = await getEvents(new Date());
		if(!events) return;
		bar.start(events.length);
		for(const event of events) {
			await deleteEvent(event.id!);
			i += 1;
			bar.increment();
		}
		bar.stop();
	} catch(err: any) {
		console.log(err);
		logger.error(err, { time: `${new Date()}` });
	}
};

export default { insertEvent, getEvents, update, deleteEvent, deleteAllEvents };
