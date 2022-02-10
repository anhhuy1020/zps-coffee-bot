const winston = require('winston');
require('winston-daily-rotate-file');
const appRoot = require('app-root-path');

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.prettyPrint(),
        winston.format.printf((info) => {
            return `${info.timestamp}|${info.level}|${info.message}`
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.DailyRotateFile ({
            format: winston.format.printf((info) => {
                return `${info.timestamp}|${info.level}|${info.message}`
            }),
            filename: 'zps_coffee-%DATE%.log',
            dirname: `${appRoot}/logs/`,
            handleExceptions: true,
            colorize: true,
            json: false,
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d'
        })
    ],
    exitOnError: false
});

logger.stream = {
    write: function(message, encoding) {
        logger.info(message);
    },
};

module.exports = logger;