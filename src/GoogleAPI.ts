import { calendar_v3, google } from 'googleapis';
import Logger from './logger';
import credentials from '../user/credentials.json';

export default class GoogleAPI {
	public calendarId: string;

	private readonly logger = new Logger('Client');

	private readonly calendar = google.calendar({ version: 'v3' });
	private readonly scopes = 'https://www.googleapis.com/auth/calendar';
	private readonly auth = new google.auth.JWT(
		credentials.client_email,
		undefined,
		credentials.private_key,
		this.scopes
	);

	constructor(calendarId: string) {
		this.calendarId = calendarId;
	}

	public async insert_event(eventId: string, subject: string, room: string, teacher: string, colorId: string, start: Date, end: Date) {
		try {
			await this.calendar.events.insert({
				auth: this.auth,
				calendarId: this.calendarId,
				requestBody: {
					'id': eventId,
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
				await this.update(eventId, subject, room, teacher, colorId, start, end);
			} else {
				this.logger.error(`insertEvent --> ${err}`);
			}
		}
	};

	public async update(eventId: string, subject: string, room: string, teacher: string, colorId: string, start: Date, end: Date) {
		try {
			await this.calendar.events.update({
				auth: this.auth,
				calendarId: this.calendarId,
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
			this.logger.error(`update --> ${err}`);
		}
	};

	public async get_events(rangeStart: Date, rangeEnd: Date | undefined = undefined): Promise<calendar_v3.Schema$Event[] | undefined> {
		try {
			let response = await this.calendar.events.list({
				auth: this.auth,
				calendarId: this.calendarId,
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
			this.logger.error(`get_events --> ${err}`);
		}
	};

	public async delete_event(eventId: string) {
		try {
			await this.calendar.events.delete({
				auth: this.auth,
				calendarId: this.calendarId,
				eventId: eventId
			});
		} catch(err: any) {
			this.logger.error(`delete_event --> ${err}`);
			return 0;
		}
	};

	public async delete_all_events() {
		let i = 0;
		const bar = this.logger.create_bar('Deleting');
		try {
			let events = await this.get_events(new Date());
			if(!events) return;
			bar.start(events.length);
			for(const event of events) {
				await this.delete_event(event.id!);
				i += 1;
				bar.increment();
			}
			bar.stop();
		} catch(err: any) {
			this.logger.error(`delete_all_events --> ${err}`);
		}
	};
}