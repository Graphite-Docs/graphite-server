const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");
const config = require("config");
const AWS = require("aws-sdk");
const s3 = new AWS.S3({
  accessKeyId: config.get("S3Key"),
  secretAccessKey: config.get("S3Secret"),
});

const Organization = require("../../models/Organizations");
const User = require("../../models/User");

//  @route  GET v1/organization/:org_id
//  @desc   Get org data
//  @access Private

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-authCheckDecrypted")
      .select("-authCheckEncrypted")
      .select("-privateKey")
      .select("-attempts");
    if (!user) {
      return res.status(404).send({ msg: "User not authorized" });
    }

    const organizations = user.organizations;

    if (!organizations) {
      res.status(404).send({ msg: "No organization found" });
    }

    //  If the user is part of multiple organizations, we need to privide a list for
    //  them to select from so that we can fetch the data for the correct organization
    if (organizations > 1) {
      return res.json({ multipleOrgs: true, organizations });
    }

    //  If it's a single orgnization, fetch the org_id and get the org data
    const org_id = organizations[0].organization;

    const organization = await Organization.find(org_id);
    if (!organization) {
      return res.status(404).send({ msg: "Organization not found" });
    }
    res.json({ multipleOrgs: false, organizations: organization });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
});

//  @route  GET v1/organization/:org_id
//  @desc   Get org data
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
      const { name, contactEmail, billingPlan } = req.body;
      const newUser = {
        user,
        role: "Owner",
      };

      const users = [];
      users.unshift(newUser);

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

module.exports = router;
