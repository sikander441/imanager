const logger = require('./logger')
const mongoConnectionString = 'mongodb://127.0.0.1/agenda';
const Agenda = require('agenda')
const agenda = new Agenda({db: {address: mongoConnectionString}});

const runRefresh = async () => {
    
  agenda.define('Refresh status of instances', async job => {
    logger.log('info','Running Refresh status on all nodes.')
    console.log('Running Refresh status on all nodes.')
    const instanceModel = require('./src/models/instance')
    var instances = await instanceModel.find({})
    logger.log('info','Total instances refreshing: '+instances.length)
    console.log('Total instances refreshing: '+instances.length)
    instances.forEach(async ins => {
      logger.log('info','currently refreshing instance with id:'+ins._id)
      const ihf = require('./src/helperFunctions/instanceHF')
      try{  
        await ihf.updateStatus(ins);
        await ins.save()
      }catch(e)
      {
        logger.log('error',e)
        
      }
    });
  });
  
  
  (async function() { // IIFE to give access to async/await
    await agenda.start();
  
    await agenda.every('3 minute', 'Refresh status of instances');
  
  })();

}

module.exports = {
    runRefresh
};