const jwt = require("jsonwebtoken");
const { loggers } = require("winston");


module.exports = function(req, res, next) {
    
  const token = req.headers["x-access-token"] || req.headers["authorization"] || req.cookies["token"];
  if (!token) return res.status(401).send("Access denied. No token provided.");

  try {
    const decoded = jwt.verify(token, "siksingh");
    req.user = decoded;
    next();
  } catch (ex) {
    loggers.loggers('Failed login attempt!')
    res.status(400).send("Invalid token.");
  }
};