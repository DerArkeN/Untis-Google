import WebUntis from 'webuntis';
import LessonMO, { color_green, color_red, cancelled_state } from './lesson';
import google from './google';
import Logger from './logger';

export default class Client {
	public readonly school: string;
	public readonly webuser: string;
	public readonly password: string;
	public readonly weburl: string;

	protected readonly logger = new Logger('Client');

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
		this.logger.info('Succesfully started Untis Client.');
		await this.logout();

		if(this.classes) {
			this.logger.info(`Running with classes:' ${this.classes}.`);
		} else {
			this.logger.info('Running with all classes.');
		}
		this.logger.info(`Running with a range of ${this.range} days.`);
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
			this.logger.error(`login --> ${err}`);
		}
	}

	protected async logout() {
		try {
			await this.untisAPI.logout();
		} catch(err: any) {
			this.logger.error(`logout --> ${err}`);
		}
	}

	public async get_timetable_from_untis(): Promise<LessonMO[]> {
		let re_timetable: LessonMO[] = [];
		let rangeStart = new Date();
		let rangeEnd = new Date();
		rangeEnd.setDate(rangeStart.getDate() + this.range);
		try {
			await this.login();
			let timetable = await this.untisAPI.getOwnClassTimetableForRange(rangeStart, rangeEnd);
			await this.logout();

			for(const val of timetable) {
				if(this.classes) {
					let subj = val.su[0];
					if(!subj) continue;
					if(!this.classes.includes(subj.name)) continue;
					let lesson = new LessonMO(val);
					re_timetable.push(lesson);
				}
				else {
					let lesson = new LessonMO(val);
					re_timetable.push(lesson);
				}
			}
			re_timetable.sort((a: LessonMO, b: LessonMO) => { return a.start.getTime() - b.start.getTime(); });

			this.logger.info(`Got ${re_timetable.length} lessons from Untis.`);
		} catch(err: any) {
			this.logger.error(`get_timetable_from_untis --> ${err}`);
		}
		return re_timetable;
	};

	public async get_timetable_from_google(): Promise<LessonMO[] | undefined> {
		let re_timetable: LessonMO[] = [];
		let rangeStart = new Date();
		let rangeEnd = new Date();
		rangeEnd.setDate(rangeStart.getDate() + this.range);

		let events = await google.get_events(rangeStart, rangeEnd);
		for(const event of events!) {
			re_timetable.push(new LessonMO(undefined, event));
		}
		re_timetable.sort((a: LessonMO, b: LessonMO) => { return a.start.getTime() - b.start.getTime(); });

		this.logger.info(`Got ${re_timetable.length} lessons from Google.`);
		return re_timetable;
	};

	public async add_initial_events(timetable: LessonMO[]) {
		try {
			const bar = this.logger.create_bar('Adding');
			bar.start(timetable.length);
			let i = 0;
			for(const lesson of timetable) {
				let colorId = lesson.lesson_state == cancelled_state ? color_red : color_green;
				await google.insert_event(lesson.eventId!, lesson.subject!, lesson.room!, lesson.teacher!, colorId, lesson.start!, lesson.end!);

				i += 1;
				bar.increment();
			}
			bar.stop();
			this.logger.info(`Adding ${i} new events.`);
		} catch(err: any) {
			this.logger.error(`add_initial_events --> ${err}`);
		}
	};

	public async rewrite() {
		await google.delete_all_events();

		let timetable = await this.get_timetable_from_untis();
		await this.add_initial_events(timetable);
	};

	private async update_lesson(lesson: LessonMO) {
		if(!lesson) return;
		let colorId = lesson.lesson_state == cancelled_state ? color_red : color_green;
		await google.update(lesson.eventId!, lesson.subject!, lesson.room!, lesson.teacher!, colorId, lesson.start!, lesson.end!);
	};

	private async add_lesson(lesson: LessonMO) {
		if(!lesson) return;
		let colorId = lesson.lesson_state == cancelled_state ? color_red : color_green;
		await google.insert_event(lesson.eventId!, lesson.subject!, lesson.room!, lesson.teacher!, colorId, lesson.start!, lesson.end!);
	};

	private async delete_lesson(lesson: LessonMO) {
		if(!lesson) return;
		await google.delete_event(String(lesson.eventId));
	};

	public async sync(google_timetable: LessonMO[], untis_timetable: LessonMO[]) {
		if(JSON.stringify(google_timetable) === JSON.stringify(untis_timetable)) {
			this.logger.info('Google and Untis are synced.');
			return;
		}

		const bar = this.logger.create_bar('Syncing');
		bar.start(untis_timetable.length);

		let sync_message = '';
		for(const lesson of untis_timetable) {
			let google_lesson = google_timetable.find(x => x.eventId == lesson.eventId);
			if(google_lesson) {
				sync_message += google_lesson.get_differences(lesson);
				if(sync_message != '') {
					await this.update_lesson(lesson);
				}
			} else {
				sync_message += `\n-Added: ${lesson.subject}. (${lesson.start.toLocaleDateString()}.)`;
				await this.add_lesson(lesson);
			}
			bar.increment();
		}
		bar.stop();

		for(const lesson of google_timetable) {
			let untis_lesson = untis_timetable.find(x => x.eventId == lesson.eventId);
			if(!untis_lesson) {
				sync_message += `\n-Deleted: ${lesson.subject}. (${lesson.start.toLocaleDateString()}.)`;
				await this.delete_lesson(lesson);
			}
		}

		this.logger.info(sync_message);
		this.logger.info('Google and Untis are synced.');
	}
}