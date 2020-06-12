const router=require('express').Router();
const logger = require('../../logger')
const teamModel = require('../models/teams')

router.get('/',(req,res) => {
  res.status(200).send('Main router')
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
