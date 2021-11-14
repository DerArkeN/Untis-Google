const untis = require('./untis.js');
const google = require('./google');

(async () => {
    const interval = setInterval(async() => {
        let date = new Date();

        if(date.getHours() == 6 && date.getMinutes() == 0) {
            console.log(date.getHours(), ':' ,date.getMinutes());
            await untis.update();
            console.log(date.getHours(), ':' ,date.getMinutes());
        }
    }, 60000);
})();