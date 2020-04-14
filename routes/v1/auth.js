const express = require("express");
const router = express.Router();
const faker = require("faker");
const jwt = require("jsonwebtoken");
const config = require("config");
const auth = require("../../middleware/auth");
const max_attempts = require("../../middleware/max_attempts");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(config.get("SENGRID_API_KEY"));

const { check, validationResult } = require("express-validator");
const User = require("../../models/User");

//  @route  POST v1/auth/register
//  @desc   Register user and generate a jwt with authData to encrypt
//  @access Public

router.post(
  "/register",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please provide a valid email address").isEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    //  Check if there are errors
    if (!errors.isEmpty()) {
      //  If there are errors, send error response
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email } = req.body;

    try {
      //  See if the user exists
      let user = await User.findOne({ email });

      if (user && user.authCheckEncrypted) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exists" }] });
      } else if (user) {
        //  User still needs to validate their email
        //  Send a new email verification
        const payload = {
          user: {
            id: user.id,
            email: user.email,
            data: user.authCheckDecrypted,
          },
        };

        //  Return JWT
        jwt.sign(
          payload,
          config.get("jwtSecret"),
          { expiresIn: 600000 },
          async (err, token) => {
            if (err) throw err;
            try {
              //  Email template with verification link that embeds the token
              const link =
                config.get("environment") === "local"
                  ? `http://localhost:3000/verify?type=registration&token=${token}`
                  : `someurl/verify?type=registration&token=${token}`;
              const msg = {
                to: email,
                from: "contact@graphitedocs.com",
                subject: "Graphite Docs - Please Verify Your Email",
                text: `Please verifiy your email address.`,
                html: "<div>Please verify your email address.</div>",
                templateId: "d-fcd00a9c46d3478ea2f5f9a6f60a3f54",
                dynamic_template_data: {
                  verificationUrl: link,
                  name,
                },
              };
              await sgMail.send(msg);
              return res.json({ msg: "Email verification sent" });
            } catch (error) {
              console.log(`New email error: ${error}`);
              return res.status(500).send("Server error");
            }
          }
        );
      } else {
        //  Generate data for the authCheckUnencrypted field
        const authCheckDecrypted = faker.lorem.paragraph();

        user = new User({
          name,
          email,
          authCheckDecrypted,
        });

        //  Save user to DB
        await user.save();

        const payload = {
          user: {
            id: user.id,
            email: user.email,
            data: user.authCheckDecrypted,
          },
        };

        //  Return JWT
        jwt.sign(
          payload,
          config.get("jwtSecret"),
          { expiresIn: 600000 },
          async (err, token) => {
            if (err) throw err;
            try {
              //  Email template with verification link that embeds the token
              const link =
                config.get("environment") === "local"
                  ? `http://localhost:3000/verify?type=registration&token=${token}`
                  : `someurl/verify?type=registration&token=${token}`;
              const msg = {
                to: email,
                from: "contact@graphitedocs.com",
                subject: "Graphite Docs - Please Verify Your Email",
                text: `Please verifiy your email address.`,
                html: "<div>Please verify your email address.</div>",
                templateId: "d-fcd00a9c46d3478ea2f5f9a6f60a3f54",
                dynamic_template_data: {
                  verificationUrl: link,
                  name,
                },
              };
              await sgMail.send(msg);
              return res.json({ msg: "Email verification sent" });
            } catch (error) {
              console.log(err);
              return res.status(500).send("Server error");
            }
          }
        );
      }
    } catch (err) {
      console.log(err);
      return res.status(500).send("Server error");
    }
  }
);

//  @route  POST v1/auth/register/validate
//  @desc   validates a newly registered user by posting a password encrypted version
//          of the auth check data, returns session JWT
//  @access Private

router.post(
  "/register/validate",
  [
    auth,
    [
      check("email", "Please provide a valid email address").isEmail(),
      check("data", "Validation data required").not().isEmpty(),
      check("publicKey", "Public key required").not().isEmpty(),
      check("privateKey", "Private key required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);

    //  Check if there are errors
    if (!errors.isEmpty()) {
      //  If there are errors, send error response
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, data, privateKey, publicKey } = req.body;

    try {
      //  See if the user exists
      let user = await User.findOne({ email });

      if (!user) {
        console.log("User does not exist");
        return res.status(400).json({ errors: [{ msg: "User data error" }] });
      }

      user["authCheckEncrypted"] = data;
      user["publicKey"] = publicKey;
      user["privateKey"] = privateKey;

      await user.save();

      const payload = {
        user: {
          id: req.user.id,
          authenticated: true,
        },
      };

      //  Return JWT
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 6000000 }, //  Almost 2 hours for the session
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.log(err);
      return res.status(500).send("Server error");
    }
  }
);

//  @route  POST v1/auth/login
//  @desc   Sends email with JWT that includes the encrypted data for validation
//  @access Public

router.post(
  "/login",
  [check("email", "Please provide a valid email address").isEmail()],
  async (req, res) => {
    const errors = validationResult(req);

    //  Check if there are errors
    if (!errors.isEmpty()) {
      //  If there are errors, send error response
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    try {
      //  See if the user exists
      const user = await User.findOne({ email });
      if (!user) {
        console.log("User does not exist");
        return res.status(400).json({ errors: [{ msg: "User data error" }] });
      }

      //  Check if user has validated account before login
      if (!user.authCheckDecrypted) {
        console.log("User has not verified account");
        const payload = {
          user: {
            id: user.id,
            email: user.email,
            data: user.authCheckDecrypted,
          },
        };

        //  Return JWT
        jwt.sign(
          payload,
          config.get("jwtSecret"),
          { expiresIn: 600000 },
          (err, token) => {
            if (err) throw err;
            //  TODO send token via email here
            return res.status(400).json({
              errors: [{ msg: "Registration not complete" }],
              msg: token,
            });
          }
        );
      }

      const payload = {
        user: {
          id: user.id,
          email: user.email,
          data: user.authCheckEncrypted,
        },
      };

      //  Return JWT
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 600000 }, // 10 min exp
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.log(err.message);
      return res.status(500).send("Server error");
    }
  }
);

//  @route  POST v1/auth/login/validate
//  @desc   validates a login by posting a decrypted version
//          of the auth check data, returns session JWT
//  @access Private

router.post(
  "/login/validate",
  [
    auth,
    max_attempts,
    [
      check("email", "Please provide a valid email address").isEmail(),
      check("data", "Validation data required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);

    //  Check if there are errors
    if (!errors.isEmpty()) {
      //  If there are errors, send error response
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, data } = req.body;

    try {
      //  See if the user exists
      const user = await User.findOne({ email });

      if (!user) {
        console.log("User does not exist");
        return res.status(400).json({ errors: [{ msg: "User data error" }] });
      }

      //  Validate the auth data check
      if (data !== user.authCheckDecrypted) {
        user["attempts"] = user.attempts ? user.attempts + 1 : 1;
        await user.save();

        return res.status(403).json({ msg: "Invalid credentials" });
      }

      //  Be sure to set attempts back to 0 on success
      user["attempts"] = 0;

      await user.save();

      const payload = {
        user: {
          id: req.user.id,
          authenticated: true,
          publicKey: user.publicKey,
          privateKey: user.privateKey,
        },
      };

      //  Return JWT
      //  Todo - convert this to send email (more secure)
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 6000000 }, //  Almost 2 hours for the session
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.log(err.message);
      return res.status(500).send("Server error");
    }
  }
);

module.exports = router;
