const User = require("../models/User");
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

    const { id } = decoded.user;
    const user = await User.findById(id);

    if(user.subscriptionEndDate) {
      const currentDate = Date.now();
      if(user.subscriptionEndDate < (currentDate/1000)) {
        return res.status(402).send('Subscription expired or cancelled');
      }
    }

    next();
  } catch(err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
}