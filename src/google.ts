import { calendar_v3, google } from 'googleapis';
import Logger from './logger';
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

const logger = new Logger('Google');

let timeZone: string;
calendar.calendars.get({ auth: auth, calendarId: calendarId }).then((value) => {
	timeZone = value['data'].timeZone!;
});

const insert_event = async (eventId: string, subject: string, room: string, teacher: string, colorId: string, start: Date, end: Date) => {
	try {
		await calendar.events.insert({
			auth: auth,
			calendarId: calendarId,
			requestBody: {
				'id': eventId,
				'summary': subject,
				'colorId': colorId,
				'location': `${room}/${teacher}`,
				'start': {
					'dateTime': start.toISOString(),
					'timeZone': timeZone
				},
				'end': {
					'dateTime': end.toISOString(),
					'timeZone': timeZone
				}
			}
		});
	} catch(err: any) {
		if(err.message == 'The requested identifier already exists.') {
			await update(eventId, subject, room, teacher, colorId, start, end);
		} else {
			logger.error(`insertEvent --> ${err}`);
		}
	}
};

const update = async (eventId: string, subject: string, room: string, teacher: string, colorId: string, start: Date, end: Date) => {
	try {
		await calendar.events.update({
			auth: auth,
			calendarId: calendarId,
			eventId: eventId,
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
		logger.error(`update --> ${err}`);

	}
};

const get_events = async (rangeStart: Date, rangeEnd: Date | undefined = undefined): Promise<calendar_v3.Schema$Event[] | undefined> => {
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
		logger.error(`get_events --> ${err}`);
	}
};

const delete_event = async (eventId: string) => {
	try {
		await calendar.events.delete({
			auth: auth,
			calendarId: calendarId,
			eventId: eventId
		});
	} catch(err: any) {
		logger.error(`delete_event --> ${err}`);
		return 0;
	}
};

const delete_all_events = async () => {
	let i = 0;
	const bar = logger.create_bar('Deleting');
	try {
		let events = await get_events(new Date());
		if(!events) return;
		bar.start(events.length);
		for(const event of events) {
			await delete_event(event.id!);
			i += 1;
			bar.increment();
		}
		bar.stop();
	} catch(err: any) {
		logger.error(`delete_all_events --> ${err}`);
	}
};

export default { insert_event, get_events, update, delete_event, delete_all_events };
