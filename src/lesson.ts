import { Lesson } from 'webuntis';
import { calendar_v3 } from 'googleapis';
import Logger from './logger';
const datefns = require('date-fns');

const color_green = '2';
const color_red = '4';
const state_cancelled = 'cancelled';

export { color_green, color_red, state_cancelled };

export default class LessonMO {
    protected readonly logger = new Logger('Lesson');

    public eventId: string = '';
    public subject: string = '';
    public room: string = '';
    public teacher: string = '';
    public start: Date = new Date();
    public end: Date = new Date();
    public lesson_state: string = '';

    constructor(lesson?: Lesson, event?: calendar_v3.Schema$Event) {
        if(lesson) {
            this.eventId = String(lesson.id);
            this.subject = lesson.su[0] != null ? lesson.su[0].longname : '';
            this.room = lesson.ro[0] != null ? lesson.ro[0].name : '';
            this.teacher = lesson.te[0] != null ? lesson.te[0].longname : '';
            this.start = datefns.parse(`${lesson.date}${lesson.startTime}`, 'yyyyMMddHmm', datefns.startOfDay(new Date()));
            this.end = datefns.parse(`${lesson.date}${lesson.endTime}`, 'yyyyMMddHmm', datefns.startOfDay(new Date()));
            if(lesson.code) this.lesson_state = lesson.code;
        }
        if(event) {
            this.eventId = event.id!;
            this.subject = event.summary!;
            let location = event.location != null ? event.location.split('/') : ['404', 'error'];
            this.room = location[0];
            this.teacher = location[1];
            this.start = new Date(event.start!.dateTime!);
            this.end = new Date(event.end!.dateTime!);
            switch(event.colorId) {
                case color_green:
                    this.lesson_state = '';
                    break;
                case color_red:
                    this.lesson_state = state_cancelled;
                    break;
            }
        }
    }

    public equals(lessson: this): boolean {
        if(this.eventId != lessson.eventId) return false;
        if(this.subject != lessson.subject) return false;
        if(this.room != lessson.room) return false;
        if(this.teacher != lessson.teacher) return false;
        if(this.start.getTime() != lessson.start.getTime()) return false;
        if(this.end.getTime() != lessson.end.getTime()) return false;
        if(this.lesson_state != lessson.lesson_state) return false;
        return true;
    }

    public get_differences(lesson: this): string {
        let out_message = '';

        let start = lesson.start.toLocaleDateString();

        let old_room = this.room;
        let new_room = lesson.room;
        let old_teacher = this.teacher;
        let new_teacher = lesson.teacher;
        let old_state = this.lesson_state;
        let new_state = lesson.lesson_state;
        let old_subject = this.subject;
        let new_subject = lesson.subject;

        if(old_room != new_room) {
            out_message += `\n-Room: ${old_room} -> ${new_room}. (${new_subject} on ${start})`;
        }
        if(old_teacher != new_teacher) {
            out_message += `\n-Teacher: ${old_teacher} -> ${new_teacher}. (${new_subject} on ${start})`;
        }
        if(!(old_state == new_state)) {
            if(new_state == state_cancelled) {
                out_message += `\n-Cancelled ${new_subject} on ${start}.`;
                this.logger.push_cancellation(new_subject, start);
            }
        }
        if(!(old_subject == new_subject)) {
            out_message += `\n-Subject: ${old_subject} -> ${new_subject}. (${new_subject} on ${start})`;
        }

        return out_message;
    }
}