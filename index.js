
//----DEFAULT IMPORTS------------
const app = require('./express')
const logger=require('./logger')
const mongoose = require('mongoose')

//--------Server config-----------
const port=process.env.PORT || 3000

//-----------connect to DB----------
const db = require('./src/db/dbconnect')


//------------Import routers-----------
const instanceRouter=require('./src/routers/instance')
const mainRouter=require('./src/routers/main')

// ---------------------- ROUTES----------------

app.use('/instances',instanceRouter);
app.use('/',mainRouter);


// ----------------Connect to MongoDB then start the server-------
db.openConnection();
mongoose.connection.on('connected', () => {
  logger.log('info','Connected to Mongo DB, Starting server now.')
  app.listen(port,(err) => {
    if(err)
     logger.log('error',err)
    else {
      logger.log('info','Server Started at port '+port)
    }
  })
});
