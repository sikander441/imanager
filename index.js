<<<<<<< HEAD
=======
const mongoConnectionString = 'mongodb://127.0.0.1/agenda';
const Agenda = require('agenda')
const ihf = require('./src/helperFunctions/instanceHF')
>>>>>>> 42d78621c9dc92b5b8bbc7dd282f72a0ed9ecf41


//----DEFAULT IMPORTS------------
const app = require('./express')
const logger=require('./logger')
const mongoose = require('mongoose')
const {runRefresh} = require('./refreshingJob')

//--------Server config-----------
const port=process.env.PORT || 3000

//-----------connect to DB----------



// ----------------Connect to MongoDB then start the server-------


const updateAllCatalogserviceStatus = async (instance) => {
  var resultSet = []
  try{
    for(var i=0 ; i<instance.CatalogServices.length ;i++ )
      {
        resultSet.push(ihf.checkServiceStatus(instance,instance.CatalogServices[i].name,true));
      }
      await Promise.all(resultSet)

    }catch(e){
      logger.log('error',e)
    }
    finally{
      await instance.save()
    }
}

logger.log('info','----------------------START OF APP----------------')
<<<<<<< HEAD
=======
db.openConnection();
mongoose.connection.on('connected', () => {

  agenda.define('Refresh status of instances', async job => {
    logger.log('info','Running Refresh status on all nodes.')
    console.log('Running Refresh status on all nodes.')
    const instanceModel = require('./src/models/instance')
    var instances = await instanceModel.find({})
    logger.log('info','Total instances refreshing: '+instances.length)
    console.log('Total instances refreshing: '+instances.length)
    instances.forEach(async ins => {
      logger.log('info','currently refreshing instance with id:'+ins._id)
     
      try{
        
        await ihf.updateStatus(ins);
        await updateAllCatalogserviceStatus(ins);
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
>>>>>>> 42d78621c9dc92b5b8bbc7dd282f72a0ed9ecf41

mongoose.connection.on('connected', () => {

  runRefresh();
  logger.log('info','Connected to Mongo DB, Starting server now.')
  app.listen(port,(err) => {
    if(err)
     logger.log('error',err)
    else {
      logger.log('info','Server Started at port '+port)
    }
  }).on('error',(e)=>{
    logger.log('error',e);
    mongoose.connection.close()
  })


});



