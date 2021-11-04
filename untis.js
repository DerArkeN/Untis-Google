require('dotenv').config();

const { parse, startOfDay } = require('date-fns');
const WebUntis = require('webuntis');
const google = require('./google');

const untisAPI = new WebUntis(process.env.SCHOOL, process.env.USER, process.env.PASSWORD, process.env.URL);

const classes = ["g2", "M2", "Mu1", "ch1", "eth2", "bio2", "inf1", "gk3", "E1", "d2", "s3"]

module.exports.getTimetableForToday = async () => {
    try {
        await untisAPI.login();
        
        let timetable = await untisAPI.getOwnClassTimetableForToday();

        filteredClasses = timetable.filter(e => classes.includes(e.su[0].name));
        filteredClasses.sort((a,b) => a.startTime - b.startTime);
            
        return filteredClasses;

        await untisAPI.logout();
    }catch(err) {
        console.log(err);
    }
}

module.exports.getTimetableFor = async (date) => {
    try {
        await untisAPI.login();
        
        let timetable = await untisAPI.getOwnClassTimetableFor(date);

        filteredClasses = timetable.filter(e => classes.includes(e.su[0].name));
        filteredClasses.sort((a,b) => a.startTime - b.startTime);

        return filteredClasses;

        await untisAPI.logout();
    }catch(err) {
        console.log(err);
    }
}

module.exports.getTimetable = async () => {
    try{
        await untisAPI.login();

        let date = new Date();
        let cTimetable = [];

        while(true) {
            try{
                let timetable = await untisAPI.getOwnClassTimetableFor(date);
    
                fTimetable = timetable.filter(e => classes.includes(e.su[0].name));

                cTimetable.push(fTimetable);
    
                date.setDate(date.getDate() + 1);
            }catch(err) {
                console.log(err);
                break;
            }finally {
                process.stdout.clearLine();
                process.stdout.cursorTo(0);
                process.stdout.write(`Gathered ${cTimetable.length} timetables.`);
            }
        }

        return cTimetable;

        await untisAPI.logout();
    }catch(err) {
        console.log(err);
    }
}

module.exports.getHolidays = async () => {
    try {
        await untisAPI.login();

        let holidays = await untisAPI.getHolidays();

        return holidays;

        await untisAPI.logout();
    }catch(err) {
        console.log(err);
    }
}

module.exports.convertAndInsertTimetable = async (cTimetable) => {
    let i = 0;
    try {
        for(const cT in cTimetable) {
            let day = cTimetable[cT];
            for(const lesson of day) {
                let date = lesson.date;
                let startTime = lesson.startTime;
                let endTime = lesson.endTime;
                let subject = lesson.su[0].longname;
                let room = lesson.ro[0].name;
                let teacher = lesson.te[0].longname;

                let start = parse(`${date}${startTime}`, 'yyyyMMddHmm', startOfDay(new Date()));
                let end = parse(`${date}${endTime}`, 'yyyyMMddHmm', startOfDay(new Date()));

                let colorId = 2;

                if(lesson.code) {
                    if(lesson.code == 'cancelled') {
                        let code = lesson.code;

                        colorId = 4;
                    }
                }

                var event = {
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
                };
                
                await google.insertEvent(event);

                i += 1;
                process.stdout.clearLine();
                process.stdout.cursorTo(0);
                process.stdout.write(`Inserted ${i} events.`);
            }
        }
    }catch(err) {
        console.log(err);
    }
}

module.exports.rewrite = async () => {
    await google.deleteAllEventsFromToday();

    let timetable = await this.getTimetable();
    await this.convertAndInsertTimetable(timetable);
}

module.exports.checkToday = async () => {
    let day = new Date();
    let events = await google.getEventsFromDay(day);

    return events;
}