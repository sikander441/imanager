const router=require('express').Router();

router.get('/',(req,res) => {
  res.status(200).send('Main router')
})


module.exports=router;
