import winston from 'winston';

const logger = winston.createLogger({
	levels: winston.config.syslog.levels,
	format: winston.format.json(),
	transports: [
		new winston.transports.File({ filename: 'error.log', level: 'error' }),
		new winston.transports.File({ filename: 'all.log' })
	]
});

export default logger;
