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
    await ihf.checkServiceStatus(instance,serviceName)
    var index = instance.CatalogServices.findIndex(x => x.name == serviceName)
    res.status(200).send(`Service ${serviceName} is set to ${instance.CatalogServices[index].status}`)
    await instance.save()
  }catch(e){
    logger.log('error',e)
    res.status(400).send('Something went wrong: '+e)
  }
})


router.get('/updateAllServices',async (req,res)=> {
  const _id=req.query.id
  try{
  var instance = await instanceModel.findById({_id})
  if(!instance)throw new Error('No instance with the ID found')
  }catch(e){
  logger.log('error',e)
  return res.status(404).send('No such instance found,please check object id'+e)
  }

  try{
    for(var i=0 ; i<instance.CatalogServices.length ;i++ )
      {
        await ihf.checkServiceStatus(instance,instance.CatalogServices[i].name,true)
      }
      res.send(instance)

    }catch(e){
      logger.log('error',e)
      res.status(400).send('Something went wrong: '+e.message)
    }
    finally{

      await instance.save()
    }
})
module.exports = router
