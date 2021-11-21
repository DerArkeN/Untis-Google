const untis = require('./untis');
const google = require('./google');
const logger = require('./logger');

(async () => {
    console.log('Started untis-google.');

    let oldT = await untis.getTimetable();
    let running = false;
    const checkUpdate = setInterval(async() => {
        if(running) return;
        running = true;
        let curT = await untis.getTimetable();

        //Check if update occured
        if(JSON.stringify(oldT) !== JSON.stringify(curT)) {
            logger.info(`Update received`, {time: `${new Date()}`});
            console.log(`Update received`);
            //Update events
            await untis.update();
            //Check if new update got new events and add them in case
            if(oldT.length < curT.length) await untis.addNew(oldT, curT);
            //Update oldT to curT
            oldT = curT;
        }

        running = false;
    }, 60 * 1000);
})();