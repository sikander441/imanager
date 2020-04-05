const app=require('express')
const instanceModel = require('../models/instance')
const logger=require('../../logger')
const ihf = require('../helperFunctions/instanceHF')
node_ssh = require('node-ssh')
ssh = new node_ssh()

const router=app.Router();


router.get('/checkCatalogStatus',async (req,res) =>{
  const _id=req.query.id
  const serviceName=req.query.serviceName
  try{
  var instance = await instanceModel.findById({_id})
  if(!instance)throw new Error('No instance with the ID found')
  }catch(e){
  logger.log('error',e)
  return res.status(404).send('No such instance found,please check object id'+e)
  }

  try{
    instance = await ihf.checkServiceStatus(instance,serviceName)
    var index = instance.CatalogServices.findIndex(x => x.name == serviceName)
    res.status(200).send('Service is set to '+instance.CatalogServices[index].status)
  }catch(e){
    logger.log('error',e)
    res.status(400).send('Something went wrong: '+e)
  }
})


module.exports = router
