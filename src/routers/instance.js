const app=require('express')
const instanceModel = require('../models/instance')

const router=app.Router();


router.get('/' , async (req,res) => {
  const ress = await instanceModel.find({})
  res.status(200).send(ress)
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
