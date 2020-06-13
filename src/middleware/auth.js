const jwt = require("jsonwebtoken");
const logger = require('../../logger')



module.exports = function(req, res, next) {
    
  const token = req.headers["x-access-token"] || req.headers["authorization"] || req.cookies["token"];

  if (!token) return res.status(401).send({status:'failed',message:"Access denied. No token provided."});

  try {
    const decoded = jwt.verify(token, "siksingh");
    req.user = decoded;
    next();
  } catch (ex) {
    logger.log('error','Failed login attempt!'+ex)
    res.status(400).send({status:'failed',message:"Invalid token."});
  }
};