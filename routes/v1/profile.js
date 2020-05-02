const express = require("express");
const router = express.Router();
const config = require("config");
const auth = require("../../middleware/auth");
const validate_upload = require("../../middleware/validate_upload");
const User = require("../../models/User");
const { check, validationResult } = require("express-validator");

const AWS = require("aws-sdk");
const s3 = new AWS.S3({
  accessKeyId: config.get("S3Key"),
  secretAccessKey: config.get("S3Secret"),
});

router.put(
  "/avatar",
  auth,
  validate_upload,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        console.log("User does not exist");
        return res.status(400).json({ errors: [{ msg: "User data error" }] });
      }

      //  Take the image data and post to S3
      const { files } = req;
      const fileKey = Object.keys(files)[0];
      const file = files[fileKey];
      const extensionSplitter = file.name.split('.');
      const extension = extensionSplitter[extensionSplitter.length - 1];
      const params = {
        Bucket: config.get("bucketName"),
        Key: `avatar/${req.user.id}/avatar.${extension}`,
        Body: file.data,
        ContentType: file.mimetype, 
        CacheControl: 'max-age=20',
        ACL:'public-read'
      };

      // Uploading files to the bucket
      await s3.upload(params, async (err, data) => {
        if (err) {
          console.log(err);
          res.status(500).send("Server error");
        }

        user['avatar'] = data.Location;
        await user.save();
        const payload = {
          user: {
            id: req.user.id,
            email: user.email,
            name: user.name,
            authenticated: true,
            subscription: user.subscription,
            publicKey: user.publicKey,
            privateKey: user.privateKey,
            avatar: user.avatar
          },
        };
        res.json(payload);
      });
    } catch (error) {
      console.log(error);
      res.status(500).send("Server error");
    }
  }
);

router.put(
  "/name",
  auth,
  [check("name", "Please provide a name").not().isEmpty()],
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        console.log("User does not exist");
        return res.status(400).json({ errors: [{ msg: "User data error" }] });
      }

      user.name = req.body.name;
      await user.save();

      const payload = {
        user: {
          id: req.user.id,
          email: user.email,
          name: user.name,
          authenticated: true,
          subscription: user.subscription,
          publicKey: user.publicKey,
          privateKey: user.privateKey,
          avatar: user.avatar
        },
      };
      res.json(payload);
    } catch (error) {
      console.log(error);
      res.status(500).send("Server error");
    }
  }
);

router.put(
  "/email",
  auth,
  [check("email", "Please provide an email").not().isEmpty()],
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        console.log("User does not exist");
        return res.status(400).json({ errors: [{ msg: "User data error" }] });
      }

      user.email = req.body.email;
      await user.save();

      const payload = {
        user: {
          id: req.user.id,
          email: user.email,
          name: user.name,
          authenticated: true,
          subscription: user.subscription,
          publicKey: user.publicKey,
          privateKey: user.privateKey,
          avatar: user.avatar
        },
      };
      res.json(payload);
    } catch (error) {
      console.log(error);
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;
