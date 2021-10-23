const google = require('./google.js');
const untis = require('./untis.js');
const { parse, startOfDay } = require('date-fns');

(async () => {
    let x = await untis.checkToday();
    console.log(x);
})();