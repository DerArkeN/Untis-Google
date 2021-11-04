const google = require('./google.js');
const untis = require('./untis.js');
const { parse, startOfDay } = require('date-fns');

(async () => {
    // const interval = setInterval(() => {
    //     let date = new Date();

    //     console.log(date.getHours(), ':' ,date.getMinutes());
    //     if(date.getHours() == 15 && date.getMinutes() === 37) {
    //     }
    // }, 60000);
    
    //untis.rewrite();
    console.log(await untis.getTimetable());
})();