const google = require('./google.js');
const untis = require('./untis.js');
const { parse, startOfDay } = require('date-fns');
const WebUntis = require('webuntis');

(async () => {
    // // const interval = setInterval(() => {
    // //     let date = new Date();

    // //     if(date.getHours() == 6 && date.getMinutes() == 0) {
    // //         console.log(date.getHours(), ':' ,date.getMinutes());
    // //         untis.rewrite();
    // //         console.log(date.getHours(), ':' ,date.getMinutes());
    // //     }
    // // }, 60000);  
    let events = await google.getEvents();    
    for(const event of events) {
        let eventId = event.id;
        let description = event.description.split('/');
        let subject = event.summary;
        let room = description[0];
        let teacher = description[1];
        let colorId = event.colorId;
        let start = new Date(event.start.dateTime);
        let end = new Date(event.end.dateTime);

        let lessons = await untis.getTimetableFor(start);
        let lesson = lessons.find(e => e.startTime == convertDateToUntisTime(start));
        
        console.log(lesson);
        if(lesson) {
            let subject1 = lesson.su[0].longname;
            let room1 = lesson.ro[0].name;
            let teacher1 = lesson.te[0].longname;

            let colorId1 = 2;
            if(lesson.code) {
                if(lesson.code == 'cancelled') {
                    let code = lesson.code;
                    colorId1 = 4;
                }
            }

            if(!(room == room1) || !(teacher == teacher1) || !(colorId == colorId1) || !(subject == subject1)){
                console.log(`Updated: ${subject} on ${start}`);
                google.update(eventId, subject1, room1, teacher1, colorId1, start, end);
            }
        }
    }

})();

function convertDateToUntisDate(date) {
    return (
        date.getFullYear().toString() +
        (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1).toString() +
        (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()).toString()
    );
}

function convertDateToUntisTime(date) {
    return (
        date.getHours().toString() + date.getMinutes().toString()
    );
}