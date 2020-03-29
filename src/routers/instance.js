const app=require('express')
const instanceModel = require('../models/instance')

const router=app.Router();


router.get('/' , async (req,res) => {
  try{
    var instances = await instanceModel.find({})
  }
  catch(e)
  {
    return res.status(400).send(e)
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
   return res.status(400).send(e.message)
 }
 res.status(200).send(instance)
})



module.exports = router;
