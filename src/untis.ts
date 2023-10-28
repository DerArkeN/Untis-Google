import { parse, startOfDay } from 'date-fns';
const progress = require('cli-progress');
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
		this.log('Succesfully started Untis Client.');

		if(this.classes) {
			this.log(`Running with classes:' ${this.classes}.`);
		} else {
			this.log('Running with all classes.');
		}
		this.log(`Running with a range of ${this.range} days.`);
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
			this.log(`login --> ${err}`, 'error');
		}
	}

	protected async logout() {
		try {
			await this.untisAPI.logout();
		} catch(err: any) {
			this.log(`logout --> ${err}`, 'error');
		}
	}

	public log(message: string, type: 'info' | 'error' = 'info') {
		switch(type) {
			case 'info':
				message = `Untis: ${message}`;
				console.log(message);
				logger.info(message, { time: `${new Date()}` });
				break;
			case 'error':
				message = `Untis Error: ${message}`;
				console.log(message);
				logger.error(message, { time: `${new Date()}` });
				break;
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
			this.log(`getTimetableFor --> ${err}`, 'error');
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

			this.log(`Gathered ${re_timetable.length} lessons.`);
		} catch(err: any) {
			this.log(`getTimetable --> ${err}`, 'error');
		}
		re_timetable.sort((a, b) => a.startTime - b.startTime);
		return re_timetable;
	};

	public async convertAndInsertTimetable(timetable: Lesson[]) {
		try {
			const bar = new progress.SingleBar({
				format: 'Untis: Inserting | {bar} | {percentage}% | {value}/{total} Events',
				barCompleteChar: '\u2588',
				barIncompleteChar: '\u2591',
				hideCursor: true
			});
			bar.start(timetable.length);
			let i = 0;
			for(const lesson of timetable) {
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
				bar.increment();
			}
			bar.stop();
			this.log(`Inserted ${i} new events.`);
		} catch(err: any) {
			this.log(`convertAndInsertTimetable --> ${err}`, 'error');
		}
	};

	public async rewrite() {
		await google.deleteAllEvents();

		let timetable = await this.getTimetable();
		await this.convertAndInsertTimetable(timetable);
	};

	public async update() {
		let rangeStart = new Date();
		let rangeEnd = new Date();
		rangeEnd.setDate(rangeStart.getDate() + this.range);
		let events = await google.getEvents(rangeStart, rangeEnd);
		if(!events) return;
		const bar = new progress.SingleBar({
			format: 'Untis: Checking | {bar} | {percentage}% | {value}/{total} Events',
			barCompleteChar: '\u2588',
			barIncompleteChar: '\u2591',
			hideCursor: true
		});
		bar.start(events.length);
		let i = 0;
		let out_message = "";
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
					out_message = out_message + `\n-Updated Room ${newSubject} on ${start}.`;
				}
				if(!(oldTeacher == newTeacher)) {
					out_message = out_message + `\n-Updated Teacher ${newSubject} on ${start}.`;
				}
				if(!(oldColorId == newColorId)) {
					if(newColorId == '4') {
						out_message = out_message + `\n-Cancelled ${newSubject} on ${start}.`;
						push.sendCancellation(newSubject, start);
					}
				}
				if(!(oldSubject == newSubject)) {
					out_message = out_message + `\n-Updated Subject ${newSubject} on ${start}.`;
				}

				if(!(oldRoom == newRoom) || !(oldTeacher == newTeacher) || !(oldColorId == newColorId) || !(oldSubject == newSubject)) {
					google.update(Number(eventId), newSubject, newRoom, newTeacher, newColorId, start, end);
				}

				i++;
				bar.increment();
			}
		}
		bar.stop();
		this.log(out_message);
		this.log('Updated all events.');
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