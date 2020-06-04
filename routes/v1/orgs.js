const express = require("express");
const router = express.Router();
const faker = require("faker");
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const jwt = require("jsonwebtoken");
const config = require("config");
const AWS = require("aws-sdk");
const s3 = new AWS.S3({
  accessKeyId: config.get("S3Key"),
  secretAccessKey: config.get("S3Secret"),
});
const sgMail = require("@sendgrid/mail");

const Organization = require("../../models/Organizations");
const User = require("../../models/User");

//  @route  GET v1/organizations/:org_id
//  @desc   Get org data
//  @access Private

router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send({ msg: "User not authorized" });
    }

    const organization = await Organization.findById(
      req.params.id
    ).populate("users", ["name", "email", "organizations"]);

    if (!organization) {
      return res.status(404).send({ msg: "No organization found" });
    }

    //  When populating the user data with the organizations array, it's possible to return organizations that
    //  should not be revealed. Need to filter for just the requesting org.

    let users = organization.users;
    for (const u of users) {
      const index = users.findIndex((a) => a._id === u._id);
      const userOrgs = users[index].organizations;
      const thisOrg = userOrgs.filter(
        (o) => o.organization.toString() === req.params.id
      )[0];
      const thisUser = users[index];
      let org = thisUser.organizations;
      org = thisOrg;
      thisUser.organizations = [].push(thisOrg);
      users[index] = thisUser;
    }

    organization.users = users;
    //  Check role of the user before returning data
    let returnFull = false;
    const nonAdminOrgDetails = {
      _id: organization._id,
      name: organization.name,
      contactEmail: organization.contactEmail,
    };
    try {
      const userRole = organization.users
        .filter((user) => user._id.toString() === req.user.id.toString())[0]
        .organizations.filter(
          (org) => org.organization.toString() === req.params.id
        )[0].role;
      nonAdminOrgDetails["role"] = userRole;
      if (userRole === "Owner" || userRole === "Admin") {
        organization["role"] = userRole;
        returnFull = true;
        return res.json(organization);
      } else {
        returnFull = false;
        return res.json(nonAdminOrgDetails);
      }
    } catch (error) {
      console.log(error);
      //  Assume the role is not admin or owner to be safe
      returnFull = false;
      return res.json(nonAdminOrgDetails);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
});

//  @route  POST v1/organizations
//  @desc   Post a new org
//  @access Private

router.post(
  "/",
  [
    auth,
    [
      check("name", "You must provide a name for your organization")
        .not()
        .isEmpty(),
      check(
        "contactEmail",
        "You must provide a valid contact email for your organization"
      )
        .not()
        .isEmpty(),
      check("billingPlan", "You must select a plan").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      //  Get the user making the request
      const user = await User.findById(req.user.id)
        .select("-authCheckDecrypted")
        .select("-authCheckEncrypted")
        .select("-privateKey")
        .select("-attempts");

      //  Post to DB
      const { name, contactEmail, billingPlan, role, teamKeys } = req.body;

      const users = [];
      users.unshift(req.user.id.toString());

      const newOrg = new Organization({
        name,
        contactEmail,
        users,
        billingPlan,
      });

      const org = await newOrg.save();

      const userOrgs = user.organizations ? user.organizations : [];
      const newUserOrg = {
        organization: org.id,
        role,
        teamKeys,
      };
      userOrgs.unshift(newUserOrg);
      user["organizations"] = userOrgs;

      await user.save();

      res.json(org);
    } catch (error) {
      console.log(error);
      res.status(500).send("Server error");
    }
  }
);

//  @route  PUT v1/organizations/:id
//  @desc   Updates Organization Info
//  @access Private

router.put(
  "/:id",
  [
    auth,
    role,
    [
      check("name", "You must provide a name for your organization")
        .not()
        .isEmpty(),
      check(
        "contactEmail",
        "You must provide a valid contact email for your organization"
      )
        .not()
        .isEmpty(),
    ],
  ],
  async (req, res) => {
    const { name, contactEmail } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const org = await Organization.findById(req.params.id);

      if (!org) {
        return res.status(404).send("Organization not found");
      }

      org["name"] = name;
      org["contactEmail"] = contactEmail;

      await org.save();

      res.json(org);
    } catch (error) {
      console.log(error);
      res.status(500).send("Server error");
    }
  }
);

//  @route  POST v1/organizations/:id/users
//  @desc   Post a new user to org
//  @access Private

router.post(
  "/:id/users",
  [
    auth,
    role,
    [
      check("name", "You must provide a name for the user").not().isEmpty(),
      check("email", "You must provide a valid email for the user")
        .not()
        .isEmpty(),
      check("role", "You must provide a role for the user").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, name, role, pending, teamKeys } = req.body;
      //  Need to create the news user in the DB
      //  If they exist, needs to update their org info

      //  See if the user exists
      let user = await User.findOne({ email });
      const org = await Organization.findById(req.params.id);

      if (user && user.authCheckEncrypted) {
        //  User already exists. Need to take the following steps:
        //  1. Check if teamKeys are part of the payload
        //  2. If not, return a response with the user to add public key
        //  3. If so, we need to:
        //    a. Update the user's org array with all org info including the team keys
        //    b. Send the user and invite letting them know they have access to this org
        //    c. Update the Organizations model to include this user ID as a member

        if (!teamKeys) {
          return res.status(200).send({
            msg:
              "User already exists, please encrypt team key and re-send request",
            key: user.publicKey,
          });
        }

        const organizations = user.organizations;
        const newOrg = {
          organization: org.id,
          role,
          pending,
          teamKeys,
        };
        organizations.unshift(newOrg);
        user["organizations"] = organizations;
        await user.save();

        const orgUsers = org.users;
        orgUsers.push(user.id.toString());

        org.users = orgUsers;
        await org.save();

        const link =
          config.get("environment") === "local"
            ? `http://localhost:3000`
            : `someurl`;
        const msg = {
          to: email,
          from: "contact@graphitedocs.com",
          subject: `Graphite Docs - You've been invited to join the ${org.name} team`,
          text: `You've been invited to join the ${org.name} team, get started now.`,
          html: `<div>You've been invited to join the ${org.name} team, get started now.</div>`,
          templateId: "d-d1bca86ff5644ed28115092d16868bcf",
          dynamic_template_data: {
            logInUrl: link,
            name,
            teamName: org.name,
          },
        };
        await sgMail.send(msg);
        res.json(org);
      } else if (user) {
        //  User has been created but has not yet created their encryption keys by using their password
        //  Need to simply send an email reminder in this scenario
        //  Can be used if we want an email reminders option in the interface
        const payload = {
          user: {
            id: user.id,
            email: email,
            name,
            data: user.authCheckDecrypted,
            subscription: false,
            org: org.id,
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
                subject: `Graphite Docs - You've been invited to join the ${org.name} team`,
                text: `Please verifiy your email address.`,
                html: "<div>Please verify your email address.</div>",
                templateId: "d-938b97e3e05f4fe296ba32a47144bab8",
                dynamic_template_data: {
                  verificationUrl: link,
                  name,
                  teamName: org.name,
                },
              };
              await sgMail.send(msg);
              return res.json(org);
            } catch (error) {
              console.log(error);
              return res.status(500).send("Server error");
            }
          }
        );
      } else {
        //  The user does not yet exist, need to take the following steps:
        //  1. Create the user like we would on a normal sign up but:
        //    a. Add the organization to the orgs array
        //    b. Send a slightly different email to the user than on normal account validation

        const authCheckDecrypted = faker.lorem.paragraph();
        const organizations = [];
        const newOrg = {
          organization: req.params.id,
          role,
          teamKeys: {},
        };
        organizations.unshift(newOrg);
        user = new User({
          name,
          email,
          organizations,
          authCheckDecrypted,
          subscription: false,
        });

        //  Save user to DB
        await user.save();

        //  Update org in DB
        const orgUsers = org.users;
        orgUsers.push(user.id.toString());

        org.users = orgUsers;
        await org.save();

        const payload = {
          user: {
            id: user.id,
            email: email,
            name,
            data: user.authCheckDecrypted,
            subscription: false,
            org: org.id,
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
                subject: `Graphite Docs - You've been invited to join the ${org.name} team`,
                text: `Please verifiy your email address.`,
                html: "<div>Please verify your email address.</div>",
                templateId: "d-938b97e3e05f4fe296ba32a47144bab8",
                dynamic_template_data: {
                  verificationUrl: link,
                  name,
                  teamName: org.name,
                },
              };
              await sgMail.send(msg);
              return res.json(org);
            } catch (error) {
              console.log(error);
              return res.status(500).send("Server error");
            }
          }
        );
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("Server error");
    }
  }
);

//  @route  DELETE v1/organizations/:id/users/:id
//  @desc   Deletes a user from the organization
//  @access Private

router.delete("/:id/users/:user_email", [auth, role], async (req, res) => {
  //  1. Find the organization
  //  2. Find the user
  //  3. Remove user from the organization's users array
  //  4. Remove organization from user's organizations array

  try {
    const email = decodeURIComponent(req.params.user_email);
    const org = await Organization.findById(req.params.id);

    if (!org) {
      return res.status(404).send("Organization not found");
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send("User not found");
    }

    const orgUsers = org.users.filter(
      (u) => u.toString() !== user.id.toString()
    );

    org.users = orgUsers;

    await org.save();

    const userOrgs = user.organizations.filter(
      (o) => o.organization.toString() !== req.params.id
    );

    user.organizations = userOrgs;

    await user.save();

    res.json(org);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
});

module.exports = router;
