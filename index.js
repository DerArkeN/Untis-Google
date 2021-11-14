const google = require('./google.js');
const untis = require('./untis.js');
const { parse, startOfDay } = require('date-fns');
const WebUntis = require('webuntis');

(async () => {
    const interval = setInterval(async() => {
        let date = new Date();

        if(date.getHours() == 13 && date.getMinutes() == 0) {
            console.log(date.getHours(), ':' ,date.getMinutes());
            await untis.update();
            console.log(date.getHours(), ':' ,date.getMinutes());
        }
    }, 60000);
})();