const mongoose = require('mongoose')
try{
mongoose.connect('mongodb://localhost/Imanager',{useNewUrlParser: true, useUnifiedTopology : true})
}
catch(e)
{
  console.log(e)
}
