const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");
const sharedAuth = require("../../middleware/sharedAuth");
const billing = require("../../middleware/billing");
const config = require("config");
const AWS = require("aws-sdk");
const s3 = new AWS.S3({
  accessKeyId: config.get("S3Key"),
  secretAccessKey: config.get("S3Secret"),
});

const Document = require("../../models/Documents");
const TeamDocument = require("../../models/TeamDocuments");
const User = require("../../models/User");

//  @route  GET v1/documents
//  @desc   Get all documents for a specific user
//  @access Private
router.get("/", auth, billing, async (req, res) => {
  //  TODO: This is a really inefficient way of fetching docs
  //  Should fetch only by the user's ID rather than scanning the entire object
  try {
    let documents = await Document.find({ user: req.user.id.toString() }).sort({
      date: -1,
    });

    //  Check if the user is a member of a team
    const user = await User.findById(req.user.id);
    const orgs = user.organizations.length > 0 ? true : false;

    if (!orgs) {
      return res.json(documents);
    }

    //  If user is member of a team, we need to fetch all docs across all teams
    //  The client will handle displaying the right docs for the right team
    //  Remember, the user can switch between teams in the UI
    for (const org of user.organizations) {
      const docs = await TeamDocument.find({
        org: org.organization.toString(),
      });
      documents.push(...docs);
    }
    res.json(documents);
  } catch (error) {
    console.log(error);
    res.status(500).send("Sever error");
  }
});

//  @route  GET v1/documents/:id
//  @desc   Get single document for a user
//  @access Private
router.get("/:doc_id", auth, billing, async (req, res) => {
  try {
    //  Get the document
    const document = await Document.findOne({ id: req.params.doc_id });
    if (document) {
      //  Verify user should have access to the document
      const user = document.user.toString();
      const docUser = req.user.id;
      if (user === docUser) {
        //  Now we fetch the contentUrl data from S3
        var getParams = {
          Bucket: config.get("bucketName"),
          Key: `${req.user.id}/${req.params.doc_id}.json`,
        };

        s3.getObject(getParams, async (err, data) => {
          // Handle any error and exit
          if (err) {
            return res.status(404).send({ msg: "Could not fetch document" });
          }

          let objectData = data.Body.toString("utf-8");
          const content = objectData;
          let documentToReturn = {
            document,
            content,
          };

          res.json(documentToReturn);
        });
      } else {
        res.status(401).send({ msg: "Unauthorized" });
      }
    } else {
      res.status(404).send({ msg: "Document does not exist" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Sever error");
  }
});

//  @route  POST v1/documents
//  @desc   Create a document
//  @access Private

router.post(
  "/",
  [
    auth,
    billing,
    [
      check("title", "You must provide a title for your document")
        .not()
        .isEmpty(),
      check("content", "You must provide content for your document")
        .not()
        .isEmpty(),
      check("id", "You must provide a unique identifier").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id, title, content } = req.body;

      const params = {
        Bucket: config.get("bucketName"),
        Key: `${req.user.id}/${id}.json`,
        Body: JSON.stringify(content),
      };

      // Uploading files to the bucket
      await s3.upload(params, async (err, data) => {
        if (err) {
          console.log(err);
          res.status(500).send("Server error");
        }
        const newDoc = new Document({
          id: id,
          title: title,
          contentUrl: data.Location,
          user: req.user.id,
        });

        const doc = await newDoc.save();

        res.json(doc);
      });
    } catch (error) {
      console.log(error);
      res.status(500).send("Server error");
    }
  }
);

//  @route  DELETE v1/documents/:doc_id
//  @desc   Delete a document
//  @access Private
router.delete("/:doc_id", auth, billing, async (req, res) => {
  try {
    const document = await Document.findOne({ id: req.params.doc_id });

    if (!document) {
      return res.status(404).send({ msg: "Document not found" });
    }

    //  Check on user
    //  Adding toString because the userId is an ObjectId, not a string
    if (document.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    //  Delete content from S3
    const params = {
      Bucket: config.get("bucketName"),
      Key: `${req.user.id}/${req.params.doc_id}.json`,
    };

    s3.deleteObject(params, async (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).send("Server error");
      }

      console.log(data);
      //  Remove document from DB
      await document.remove();

      //  Fetch document list
      const documents = await Document.find();
      res.json(documents);
    });
  } catch (error) {
    console.log(error);
    if (error.kind === "ObjectId") {
      return res.status(404).send({ msg: "Document not found" });
    }
    res.status(500).send("Sever error");
  }
});

//  @route  PUT v1/documents/:doc_id
//  @desc   Updated a user's document
//  @access Private

router.put("/:doc_id", auth, billing, async (req, res) => {
  try {
    //  This endpoint takes both posts for a single user's document and for
    //  documents shared with the team. So we need to check for the teamDoc
    //  variable. If true, we need to then check the access array

    const {
      id,
      title,
      content,
      teamContent,
      teamDoc,
      wholeTeam,
      access,
      orgId,
    } = req.body;

    //  Will check if the document is available in the normal document model
    //  regardless of whether it's a single user document or a team document.
    //  If it is available, we will still need to check if the teamDoc variable
    //  is set to true.

    let document = await Document.findOne({ id: req.params.doc_id });
    let teamDocument;

    //  Check if need to fetch teamDoc and then fetch it

    if (teamDoc) {
      const isOwner = document ? true : false;
      const accessAvailable = access.indlues(req.user.id.toString());

      if (!accessAvailable && !isOwner) {
        return res.status(401).send("Unauthorized");
      }

      teamDocument = await TeamDocument.findOne({ id: req.params.doc_id });

      //  If the team document is not found, we need upload it and create it
      //  Note: teamContent is the content encrypted with the teamKey
      //  content is the content encrypted with the owner's key

      const params = {
        Bucket: config.get("bucketName"),
        Key: `${orgId}/${id}.json`,
        Body: JSON.stringify(teamContent),
      };

      await s3.upload(params, async (err, data) => {
        if (err) {
          console.log(err);
          res.status(500).send("Server error");
        }

        if (!teamDocument) {
          teamDocument = new TeamDocument({
            id,
            org: orgId,
            wholeTeam,
            owner: req.user.id,
            title,
            access,
            contentUrl: data.Location,
          });

          await teamDocument.save();
        } else {
          const documentFields = {
            id,
            title,
            access,
            wholeTeam,
            contentUrl: data.Location,
          };

          teamDocument = await TeamDocument.findOneAndUpdate(
            { id: req.params.doc_id },
            { $set: documentFields },
            { new: true }
          );

          await teamDocument.save();
        }
      });
    }

    if (!document && !teamDoc) {
      return res.status(404).send({ msg: "Document not found" });
    }

    if (document.user.toString() !== req.user.id) {
      //  If this is a teamDoc, may be false and it's ok
      //  We just need to return the team document object
      if (teamDoc) {
        return res.json(teamDocument);
      } else {
        //  If not a teamDoc and the user is not authorized, reject access
        return res.status(401).json({ msg: "User not authorized" });
      }
    }

    //  Save content for individual user to S3

    const params = {
      Bucket: config.get("bucketName"),
      Key: `${req.user.id}/${id}.json`,
      Body: JSON.stringify(content),
    };

    // Uploading files to the bucket
    await s3.upload(params, async (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).send("Server error");
      }
      //  Update the document
      const documentFields = {
        id,
        title,
        contentUrl: data.Location,
      };

      document = await Document.findOneAndUpdate(
        { id: req.params.doc_id },
        { $set: documentFields },
        { new: true }
      );

      await document.save();

      res.json(document);
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
});

//  @TODO handle this for team documents

//  @route  PUT v1/documents/tags/:doc_id
//  @desc   Add a tag to a user's document
//  @access Private

router.put("/tags/:doc_id", auth, billing, async (req, res) => {
  try {
    let document = await Document.findOne({ id: req.params.doc_id });

    if (!document) {
      return res.status(404).send({ msg: "Document not found" });
    }

    //  Check on user
    //  Adding toString because the userId is an ObjectId, not a string
    if (document.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    //  Add new tag - TODO - check for uniqueness of tag?

    const { tagId, tagName } = req.body;
    const newTag = {
      id: tagId,
      name: tagName,
    };
    const tags = document.tags;

    tags.push(newTag);

    document.tags = tags;

    await document.save();

    res.json({ msg: "Added tag" });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
});

router.delete("/tags/:doc_id/:tag_id", auth, billing, async (req, res) => {
  try {
    let document = await Document.findOne({ id: req.params.doc_id });

    if (!document) {
      return res.status(404).send({ msg: "Document not found" });
    }

    //  Check on user
    //  Adding toString because the userId is an ObjectId, not a string
    if (document.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    const tags = document.tags;
    const index = tags.map((tag) => tag.id).indexOf(req.params.tag_id);

    if (index > -1) {
      tags.splice(index, 1);
    }

    document.tags = tags;

    await document.save();

    res.json(document);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
});

router.put("/shared-link/:doc_id", auth, billing, async (req, res) => {
  try {
    let document = await Document.findOne({ id: req.params.doc_id });

    if (!document) {
      return res.status(404).send({ msg: "Document not found" });
    }

    //  Check on user
    //  Adding toString because the userId is an ObjectId, not a string
    if (document.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    const { content, shareId } = req.body;

    const params = {
      Bucket: config.get("bucketName"),
      Key: `${req.user.id}/shared/${shareId}/${req.params.doc_id}.json`,
      Body: JSON.stringify(content),
    };

    // Uploading files to the bucket
    await s3.upload(params, async (err, data) => {
      if (err) {
        return res.status(500).send("Server error");
      }

      const sharedLinkFields = {
        shareId,
        active: true,
        contentUrl: data.Location,
      };

      let links = [];
      if (document.shareLink) {
        links = document.shareLink;
        links.unshift(sharedLinkFields);
      } else {
        links.unshift(sharedLinkFields);
      }

      document["shareLink"] = links;
      await document.save();

      return res.json({ msg: "Shared link document saved" });
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
});

//  @route  GET v1/documents/shared/:share_id/:doc_id
//  @desc   Get single document for a user from a share link
//  @access Private
router.get("/shared/:share_id/:doc_id", sharedAuth, async (req, res) => {
  try {
    //  Get the document
    const document = await Document.findOne({ id: req.params.doc_id });
    if (document) {
      //  Check on user
      //  Adding toString because the userId is an ObjectId, not a string
      if (document.user.toString() !== req.user) {
        return res.status(401).json({ msg: "User not authorized" });
      }

      //  Get the shareLink info
      if (!document.shareLink) {
        return res.status(401).json({ msg: "Document not shared" });
      }

      const sharedData = document.shareLink;

      const thisLink = sharedData.filter(
        (a) => a.shareId === req.params.share_id
      )[0];

      //  If link data not found, it means it was deleted or never available
      if (!thisLink) {
        return res.status(401).json({ msg: "Document not shared" });
      }

      //  Now we fetch the contentUrl data from S3
      var getParams = {
        Bucket: config.get("bucketName"),
        Key: `${req.user}/shared/${req.params.share_id}/${req.params.doc_id}.json`,
      };

      s3.getObject(getParams, async (err, data) => {
        // Handle any error and exit
        if (err) {
          return res.status(404).send({ msg: "Could not fetch document" });
        }

        let objectData = data.Body.toString("utf-8");
        const content = objectData;
        const sharedDoc = {
          readOnly: thisLink.readOnly,
          id: document.id,
          title: document.title,
          content,
        };

        res.json(sharedDoc);
      });
    } else {
      res.status(404).send({ msg: "Document does not exist" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Sever error");
  }
});

//  @route  DELETE v1/documents/shared/:share_id/:doc_id
//  @desc   Delete access to a document shared with a link
//  @access Private
router.delete(
  "/shared-link/:share_id/:doc_id",
  auth,
  billing,
  async (req, res) => {
    try {
      //  Get the document
      const document = await Document.findOne({ id: req.params.doc_id });
      if (document) {
        //  Check on user
        //  Adding toString because the userId is an ObjectId, not a string
        if (document.user.toString() !== req.user.id) {
          return res.status(401).json({ msg: "User not authorized" });
        }

        //  Get the shareLink info
        if (!document.shareLink) {
          return res.status(401).json({ msg: "Document not shared" });
        }

        const shareData = document.shareLink;
        const index = shareData
          .map((a) => a.shareId)
          .indexOf(req.params.share_id);

        if (index > -1) {
          shareData.splice(index, 1);
        } else {
          return res.status(500).send("Server error");
        }

        document.shareLink = shareData;

        //  Delete shared content from S3
        var deleteParams = {
          Bucket: config.get("bucketName"),
          Key: `${req.user}/shared/${req.params.share_id}/${req.params.doc_id}.json`,
        };

        s3.deleteObject(deleteParams, async (err, data) => {
          if (err) {
            console.log(err);
            res.status(500).send("Server error");
          }

          await document.save();
          res.json(document);
        });
      } else {
        res.status(404).send({ msg: "Document does not exist" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("Sever error");
    }
  }
);

//  @route  PUT v1/documents/shared/:share_id/:doc_id
//  @desc   Update access to a document shared with a link
//  @access Private
router.put(
  "/shared-link/:share_id/:doc_id",
  auth,
  billing,
  async (req, res) => {
    try {
      //  Get the document
      const document = await Document.findOne({ id: req.params.doc_id });
      if (document) {
        //  Check on user
        //  Adding toString because the userId is an ObjectId, not a string
        if (document.user.toString() !== req.user.id) {
          return res.status(401).json({ msg: "User not authorized" });
        }

        //  Get the shareLink info
        if (!document.shareLink) {
          return res.status(401).json({ msg: "Document not shared" });
        }

        const shareData = document.shareLink;
        const index = shareData
          .map((a) => a.shareId)
          .indexOf(req.params.share_id);

        if (index > -1) {
          const thisShareLink = shareData[index];
          thisShareLink.readOnly = !thisShareLink.readOnly;

          shareData[index] = thisShareLink;
        } else {
          return res.status(500).send("Server error");
        }

        document.shareLink = shareData;

        await document.save();
        res.json(document);
      } else {
        res.status(404).send({ msg: "Document does not exist" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("Sever error");
    }
  }
);

module.exports = router;
