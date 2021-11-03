const google = require('./google.js');
const untis = require('./untis.js');
const { parse, startOfDay } = require('date-fns');

(async () => {
    const interval = setInterval(() => {
        let date = new Date();

        if(date.getHours() == 21 && date.getMinutes() === 24) {
            untis.rewrite();
        }
    }, 30000);
})();