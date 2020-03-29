const winston = require('winston');
const { format, transports } = winston;

const files = new winston.transports.File({ filename: './logs/imanager.log' });
winston.add(files);
winston.configure({
  format: format.combine(
    format.timestamp({
         format: 'YYYY-MM-DD HH:mm:ss'
       }),
      format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`),
    ),
    transports: [
      new winston.transports.File({ filename: './logs/imanager.log' }),
       new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
    ]
})

module.exports =winston
