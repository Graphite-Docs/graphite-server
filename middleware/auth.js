const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = async function(req, res, next) {
  //  Get token from header
  const token = req.header('Authorization').split('Bearer ')[1];
  //  Check if no token
  if(!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  //  Verify token
  try {
    const decoded = await jwt.verify(token, config.get('jwtSecret'));

    //  Decoded token has a user key, return that to the request
    req.user = decoded.user;
    next();
  } catch(err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
}