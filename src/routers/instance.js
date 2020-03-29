const app=require('express')
const instanceModel = require('../models/instance')
const logger=require('../../logger')

const router=app.Router();


router.get('/' , async (req,res) => {
  try{
    var instances = await instanceModel.find({})
  }
  catch(e)
  {
    logger.log('warn','Failed to get instances',e)
    return res.status(400).send('Failed to get instances')
  }

  res.status(200).send(instances)
})




router.post('/',  async (req,res) => {

  var instance =  new instanceModel(req.body)

  try{
  var instance = await instance.save()
  }
 catch(e)
 {
   logger.log('error','Failed to save instance :'+e)
   return res.status(400).send(e.message)
 }

 res.status(200).send(instance)
 logger.log('info','Saved instance succesfully '+instance)
})



module.exports = router;
