

//----DEFAULT IMPORTS------------
const app = require('./express')
const logger=require('./logger')
const mongoose = require('mongoose')
const {runRefresh} = require('./refreshingJob')

//--------Server config-----------
const port=process.env.PORT || 3000

//-----------connect to DB----------



// ----------------Connect to MongoDB then start the server-------



logger.log('info','----------------------START OF APP----------------')

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



