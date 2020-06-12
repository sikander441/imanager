const router=require('express').Router();
const logger = require('../../logger')
const teamModel = require('../models/teams')

router.get('/',(req,res) => {
  res.status(200).send('Main router')
})

router.get('/getInstances/:teamName',async (req,res) =>{
  teamName = req.params.teamName
  try{
    let team = await teamModel.findOne({teamName})
    team = await team.populate('instances').execPopulate();
    res.status(200).send(team);
  }catch(e){
    logger.log('error',e)
    res.status(400).send({status:'failed',message:"something went wrong "+e.message})
  }
 
})

router.post('/RegisterTeam',async (req,res) => {
  try{
    const teamName=req.body.teamName
    const username=req.body.username
    const password=req.body.password

    await teamModel.create({teamName,username,password})

    res.status(200).send('Registered Succesfully')

  }catch(err){
    logger.log('error',err)
    res.status(400).send('Something went wrong'+err.message)
  }

})


module.exports=router;
