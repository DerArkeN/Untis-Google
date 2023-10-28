import { parse, startOfDay } from 'date-fns';
import WebUntis, { Lesson, LoginSessionInformations } from 'webuntis';
import google from './google';
import logger from './logger';
import push from './pushsafer';

export default class UntisClient {
	public readonly school: string;
	public readonly webuser: string;
	public readonly password: string;
	public readonly weburl: string;

	protected readonly color_green = '2';
	protected readonly color_red = '4';

	protected classes: String[] | undefined;
	protected range: number = 30;

	protected untisAPI: WebUntis;

	constructor(school: string, weburl: string, webuser: string, password: string) {
		this.school = school;
		this.webuser = webuser;
		this.password = password;
		this.weburl = weburl;

		this.untisAPI = new WebUntis(school, webuser, password, weburl);
	}

	public async start() {
		await this.login();
		console.log('Succesfully started Untis Client');

		if(this.classes) {
			console.log('Running with classes:', this.classes);
		} else {
			console.log('Running with all classes');
		}
	}

	public set_classes(classes: String[]) {
		this.classes = classes;
	}

	public set_range(days: number) {
		this.range = days;
	}

	protected async login() {
		try {
			await this.untisAPI.login();
		} catch(err: any) {
			console.log(`Error at login --> ${err}`);
			logger.error(err, { time: `${new Date()}` });
		}
	}

	protected async logout() {
		try {
			await this.untisAPI.logout();
		} catch(err: any) {
			console.log(`Error at logout --> ${err}`);
			logger.error(err, { time: `${new Date()}` });
		}
	}

	public async getTimetableFor(date: Date): Promise<Lesson[]> {
		let cTimetable: Lesson[] = [];
		try {
			let timetable = await this.untisAPI.getOwnClassTimetableFor(date);

			for(const val of timetable) {
				let subj = val.su[0];
				if(!subj) continue;
				if(this.classes) {
					if(this.classes.includes(subj.name)) {
						cTimetable.push(val);
					}
				} else {
					cTimetable.push(val);
				}
			}

			cTimetable.sort((a, b) => a.startTime - b.startTime);
		} catch(err: any) {
			console.log(`Error at getTimatetableFor --> ${err}`);
			logger.error(err, { time: `${new Date()}` });
		}
		return cTimetable;
	};

	public async getTimetable(): Promise<Lesson[]> {
		let re_timetable: Lesson[] = [];
		let rangeStart = new Date();
		let rangeEnd = new Date();
		rangeEnd.setDate(rangeStart.getDate() + this.range);
		try {
			let timetable = await this.untisAPI.getOwnClassTimetableForRange(rangeStart, rangeEnd);

			if(this.classes) {
				for(const val of timetable) {
					let subj = val.su[0];
					if(!subj) continue;
					if(!this.classes.includes(subj.name)) continue;
					re_timetable.push(val);
				}
			} else {
				re_timetable = timetable;
			}

			console.log(`Gathered ${re_timetable.length} timetables.\r`);
			logger.info(`Gathered ${re_timetable.length} timetables.`, { time: `${new Date()}` });

			re_timetable.sort((a, b) => a.startTime - b.startTime);
		} catch(err: any) {
			console.log(err);
			logger.error(err, { time: `${new Date()}` });
		}
		return re_timetable;
	};

	public async convertAndInsertTimetable(cTimetable: Lesson[]) {
		try {
			let i = 0;
			for(const lesson of cTimetable) {
				let id = lesson.id;
				let date = lesson.date;
				let startTime = lesson.startTime;
				let endTime = lesson.endTime;
				let subject = lesson.su[0] != null ? lesson.su[0].longname : "";
				let room = lesson.ro[0] != null ? lesson.ro[0].name : "";
				let teacher = lesson.te[0] != null ? lesson.te[0].longname : "";

				let start = parse(`${date}${startTime}`, 'yyyyMMddHmm', startOfDay(new Date()));
				let end = parse(`${date}${endTime}`, 'yyyyMMddHmm', startOfDay(new Date()));

				let colorId = this.color_green;

				if(lesson.code) {
					if(lesson.code == 'cancelled') {
						colorId = this.color_red;
					}
				}

				await google.insertEvent(id, subject, room, teacher, colorId, start, end);

				i += 1;

				process.stdout.write(`Inserted ${i} events.\r`);
				logger.info(`Inserted ${subject} on ${start}`, { time: `${new Date()}` });
			}
			console.log('');
		} catch(err: any) {
			console.log(err);
			logger.error(err, { time: `${new Date()}` });
		}
	};

	public async rewrite() {
		await google.deleteAllEventsFromToday();

		let timetable = await this.getTimetable();
		await this.convertAndInsertTimetable(timetable);
	};

	public async update(date: string | Date) {
		let events = await google.getEventsMin(date);
		if(!events) {
			console.log('No events found');
			return;
		}
		let i = 0;
		for(const event of events) {
			let eventId = event.id;
			let location = event.location != null ? event.location.split('/') : ['404', 'error'];
			let oldRoom = location[0];
			let oldTeacher = location[1];
			let oldSubject = event.summary;
			let oldColorId = event.colorId;
			let start = new Date(event.start!.dateTime!);
			let end = new Date(event.end!.dateTime!);

			let lessons = await this.getTimetableFor(start);
			let lesson = lessons.find(e => e.id == Number(eventId));

			if(lesson) {
				let newSubject = lesson.su[0] != null ? lesson.su[0].longname : "";
				let newRoom = lesson.ro[0] != null ? lesson.ro[0].name : "";
				let newTeacher = lesson.te[0] != null ? lesson.te[0].longname : "";

				let newColorId = this.color_green;
				if(lesson.code) {
					if(lesson.code == 'cancelled') {
						newColorId = this.color_red;
					}
				}

				if(!(oldRoom == newRoom)) {
					console.log(`Updated Room: ${newSubject} on ${start}.`);
					logger.info(`Updated Room: ${newSubject} on ${start}.`, { time: `${new Date()}` });
				}
				if(!(oldTeacher == newTeacher)) {
					console.log(`Updated Teacher: ${newSubject} on ${start}.`);
					logger.info(`Updated Teacher: ${newSubject} on ${start}.`, { time: `${new Date()}` });
				}
				if(!(oldColorId == newColorId)) {
					if(newColorId == '4') {
						console.log(`Cancelled: ${newSubject} on ${start}.`);
						logger.info(`Cancelled: ${newSubject} on ${start}.`, { time: `${new Date()}` });
						push.sendCancellation(newSubject, start);
					}
				}
				if(!(oldSubject == newSubject)) {
					console.log(`Updated Subject: ${newSubject} on ${start}.`);
					logger.info(`Updated Subject: ${newSubject} on ${start}.`, { time: `${new Date()}` });
				}

				if(!(oldRoom == newRoom) || !(oldTeacher == newTeacher) || !(oldColorId == newColorId) || !(oldSubject == newSubject)) {
					google.update(Number(eventId), newSubject, newRoom, newTeacher, newColorId, start, end);
				}

				i++;
				process.stdout.write(`Checked ${i}/${events.length} events\r`);
			}
		}
		console.log('');
		logger.info('Updated all events', { time: `${new Date()}` });
		console.log('Updated all events');
	};

	public async addNew(oldT: Lesson[], curT: Lesson[]) {
		if(oldT && curT) {
			let cur1: number[] = [];
			let old1: number[] = [];
			let newEvents: Lesson[] = [];

			for(const event of oldT) {
				old1.push(event.id);
			}
			for(const event of curT) {
				cur1.push(event.id);
			}

			let ids = cur1.filter(x => !old1.includes(x));

			for(const id of ids) {
				let event = curT.find(x => x.id == id);
				if(event) newEvents.push(event);
			}

			await this.convertAndInsertTimetable(newEvents);
		}
		return;
	};
}