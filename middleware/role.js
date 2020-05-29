const jwt = require('jsonwebtoken');
const config = require('config');
const User = require("../models/User");

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

    const { exp } = decoded;
    if (Date.now() >= exp * 1000) {
      return res.status(401).json({ msg: 'Invalid token' });
    }
    //  Decoded token has a user key, return that to the request
    req.user = decoded.user;

    //  Fetch user and verify they have valid org permissions
    const user = await User.findById(req.user.id)
    if(!user) {
      return res.status(400).send('User not found');
    }

    try {
      const organizations = user.organizations;
      const thisOrg = organizations.filter(org => org.organization.toString() === req.params.id)[0];
      const role = thisOrg.role;

      if(role !== "Owner" && role !== "Admin") {
        return res.status(403).send('Unauthorized');
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send('Server error');
    }    

    next();
  } catch(err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
}