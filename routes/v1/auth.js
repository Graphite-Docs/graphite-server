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

/**
 * @route  GET v1/auth/verifyPayment/:user_id
 * @desc   Gets a specific user and verifies their current payment status
 * @access Private
 */

router.get("/verifyPayment/:user_id", auth, async (req, res) => {
  try {
    if (req.user.id !== req.params.user_id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    const user = await User.findById(req.user.id);

    res.json({ payment: user.subscription });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
});

/**
 *  @route  GET v1/auth/user
 *  @desc   Gets logged in user
 *  @access Private
 */

router.get("/user", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-authCheckDecrypted")
      .select("-authCheckEncrypted")
      .select("-attempts");
    const payload = {
      user,
    };

    res.json(payload);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
});

/**
 *  @route  GET v1/auth/user/:id
 *  @desc   Gets a specific user
 *  @access Private
 */

router.get("/user/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("publicKey")

    res.json(user);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
});

/**
 *  @route  POST v1/auth/register
 *  @desc   Register user and generate a jwt with authData to encrypt
 *  @access Public
 */

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
            subscription: user.subscription,
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
          subscription: false,
        });

        //  Save user to DB
        await user.save();

        const payload = {
          user: {
            id: user.id,
            email: email,
            name,
            data: user.authCheckDecrypted,
            subscription: false,
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

/**
 *  @route  POST v1/auth/register/validate
 *  @desc   validates a newly registered user by posting a password encrypted version of the auth check data, returns session JWT
 *  @access Private
 */

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

    const { email, data, privateKey, publicKey, org } = req.body;

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
      user["subscription"] = false;

      //  Check if org is passed through
      //  If there is an org ID it means the user was invited by an organization.
      //  Need to then take the following steps: 
      //  1. Update the invite status on the org array in the User Model
      //  2. Send a notification to the org account owner that the invite was accepted
      if(org) {
        const orgIndex = user.organizations.map(o => { return o.organization }).indexOf(org);
        console.log(orgIndex);
        let organizations = user.organizations;

        organizations[orgIndex].pending = false;
        user.organizations = organizations;
        //  TODO: Send email to org admin here
      }

      await user.save();

      const payload = {
        user: {
          id: req.user.id,
          email: user.email,
          name: user.name,
          authenticated: true,
          subscription: false,
          organizations: user.organizations,
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

/**
 *  @route  POST v1/auth/login
 *  @desc   Sends email with JWT that includes the encrypted data for validation
 *  @access Public
 */

/** Kicks off a login process */
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
        return res.status(400).json({ msg: "Check your email or password" });
      }

      //  Check if user has validated account before login
      if (!user.authCheckDecrypted) {
        console.log("User has not verified account");
        const payload = {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            subscription: user.subscription,
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
          name: user.name,
          subscription: user.subscription,
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

/**
 *  @route  POST v1/auth/login/validate
 *  @desc   validates a login by posting a decrypted version of the auth check data, returns session JWT
 *  @access Private
 */

/** Validates a login */
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
          email: user.email,
          name: user.name,
          authenticated: true,
          publicKey: user.publicKey,
          privateKey: user.privateKey,
          avatar: user.avatar,
          organizations: user.organizations
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
      console.log(err.message);
      return res.status(500).send("Server error");
    }
  }
);

module.exports = router;
