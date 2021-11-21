const untis = require('./untis');
const google = require('./google');
const logger = require('./logger');

(async () => {
    console.log('Started untis-google.');

    let oldT = await untis.getTimetable();
    const checkUpdate = setInterval(async() => {
        let curT = await untis.getTimetable();

        //Check if update occured
        if(JSON.stringify(oldT) === JSON.stringify(curT)) return false;
        logger.info(`Update received`, {time: `${new Date()}`});
        //Update events
        await untis.update();
        //Check if new update got new events and add them in case
        if(oldT.length !== curT.length) await untis.addNew(oldT, curT);;
        oldT = curT;
    }, 60000);
})();