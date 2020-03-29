
//----DEFAULT IMPORTS------------
const app = require('./express')


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

app.listen(port,(err) => {
  if(err)
   console.log(err)
  else {
    console.log('Running on port '+port)
  }
})
