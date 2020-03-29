const mongoose = require('mongoose')
const logger=require('../../logger')


mongoose.connection.on('error',err=>{
  logger.log('error','Failed to connect to mongo DB server ',err)
});
mongoose.connection.on('connecting',()=>{
  logger.log('info','Connecting to database server ')
});


openConnection = async () =>
{
  mongoose.connect('mongodb://localhost/Imanager',{useNewUrlParser: true, useUnifiedTopology : true}).catch((err)=>{
    logger.log('error','Failed to connect to database ',err)
  })
}
module.exports = {
  openConnection
}
