const mongoConnectionString = 'mongodb://127.0.0.1/agenda';
const Agenda = require('agenda')

const agenda = new Agenda({db: {address: mongoConnectionString}});

//----DEFAULT IMPORTS------------
const app = require('./express')
const logger=require('./logger')
const mongoose = require('mongoose')
var http = require('http').createServer(app);
var io = require('socket.io')(http);

//--------Server config-----------
const port=process.env.PORT || 3000

//-----------connect to DB----------
const db = require('./src/db/dbconnect')


//------------Import routers-----------
const instanceRouter=require('./src/routers/instance')
const mainRouter=require('./src/routers/main')
const userRouter = require('./src/routers/user')

// ---------------------- ROUTES----------------

app.use('/user',userRouter);
app.use('/instances',instanceRouter);
app.use('/',mainRouter);





app.io = io


// ----------------Connect to MongoDB then start the server-------



logger.log('info','----------------------START OF APP----------------')
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


  logger.log('info','Connected to Mongo DB, Starting server now.')
  http.listen(port,(err) => {
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



io.on('connection' , (socket) => {
  console.log('Number of clients connected',socket.conn.server.clientsCount);
  socket.on('disconnect', ()=>{
    console.log('Number of clients connected',socket.conn.server.clientsCount);
  })
})

