const jwt = require("jsonwebtoken");
const config = require("config");
const User = require("../models/User");

module.exports = async function (req, res, next) {
  //  Get token from header
  const token = req.header("Authorization").split("Bearer ")[1];
  //  Check if no token
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  //  Verify token
  try {
    const decoded = await jwt.verify(token, config.get("jwtSecret"));

    const user = await User.findById(decoded.user.id);

    if (!user) {
      console.log("User does not exist");
      return res.status(400).json({ errors: [{ msg: "User data error" }] });
    }

    if (user && user.attempts && user.attempts >= config.get("MAX_ATTEMPTS")) {
      //  Ideally we would log the ip address here to track mailicious attempts
      console.log("Exceeded auth attempts");
      return res
        .status(400)
        .json({
          errors: [{ msg: "Account locked out, please contact support" }],
        });
    }

    next();
  } catch (err) {
    res.status(500).send("Server error");
  }
};
