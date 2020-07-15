const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi)

const UserSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 50
    },
    email: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 255,
      unique: true
    },
    password: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 255
    },
    isAdmin:{
      type:Boolean,
      default:false  
    },
    team:{
        type:mongoose.ObjectId,
        ref:"teams"
    },
    instances:[{
      type:mongoose.ObjectId,
      ref:'instances'
    }]
  });

  UserSchema.methods.generateAuthToken = function() { 
    const token = jwt.sign({ _id: this._id, isAdmin: this.isAdmin },'siksingh');    
    return token;
  }


  UserSchema.methods.deleteInstanceWithId = async function(_id){

    try{
    await this.populate('instances','_id').execPopulate();
    const index = this.instances.map( _ => _._id ).indexOf(_id)
    if(index > -1 ){
        this.instances.splice(index,1)
        await this.save();
    }
    else{
        throw new Error('No such instance found for this user : ')
    }
    }catch(e){
        logger.log('error',e)
        throw e
    }
    

}

  userModel = mongoose.model('users',UserSchema)

  function validateUser(user) {
    const schema = {
      name: Joi.string().min(3).max(50).required(),
      email: Joi.string().min(5).max(255).required().email(),
      password: Joi.string().min(3).max(255).required(),
      team:Joi.objectId()
    };
  
    return Joi.validate(user, schema);
  }


module.exports = {
  userModel,
  validateUser
}
