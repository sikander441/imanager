
const auth = require("../middleware/auth");
const bcrypt = require("bcrypt");
const { userModel,validateUser } = require("../models/users");
const teamModel = require('../models/teams')
const logger =  require('../../logger')

const app = require('express');
const { loggers } = require("winston");
const router=app.Router();

router.get("/current", auth, async (req, res) => {
  try{
    let user = await userModel.findById(req.user._id).select("-password")
    user = await user.populate('team','teamName').execPopulate()
    res.send(user);
  }catch(e){
    logger.log('error',e)
    res.status(400).send({status:'failed',message:e.message})
  }
   
  });

  router.post("/", async (req, res) => {
    
    const { error } = validateUser(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    if(!req.body.team)
    return res.status(400).send('Team id not given');
  
    //find an existing user
    let user = await userModel.findOne({ email: req.body.email });
    if (user) return res.status(400).send("User already registered.");
  
    user = new userModel({
      name: req.body.name,
      password: req.body.password,
      email: req.body.email,
      team:req.body.team
    });
    user.password = await bcrypt.hash(user.password, 10);
    
    let team = {}
    try{
      team = await teamModel.findOne({_id:user.team})
      if(!team)throw new Error('no such team')
    }catch(e){
      logger.log('error','Team not found for user: '+user.email)
      return res.status(400).send('No such team found.')
    }
    try{
      await user.save();
      team.members.push(user._id);
      await team.save();
    }catch(e){
      logger.log('error',e);
      return res.status(400).send({status:'fail',message:'Something went wrong: '+e.message})
    }
  

    res.send({status:'success',user})
  });

  router.post('/login',async (req,res) => {

    let email = req.body.email;
    let password = req.body.password
    if(!email || !password) return res.status(400).send("Provide info")
    let user = await userModel.findOne({ email: req.body.email });
    if (!user) return res.status(400).send("No Such user found");
    if(bcrypt.compareSync(password, user.password))
    {
      const token = user.generateAuthToken();
        let options = {
          maxAge: 1000 * 60 * 300, 
          httpOnly: true, 
      }
      res.cookie('token',token,options).header("x-auth-token", token).status(200).send({status:'success'})
    }
    else
     res.status(400).send({status:'failed'})
  

  })
  

  module.exports = router;