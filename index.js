const express = require("express");
const expressOasGenerator = require('express-oas-generator');
var cors = require('cors')
const http = require("http");
const socketIO = require("socket.io");
const newUserAccount = require('./routes/account/user/new');
const newOrgAccount = require('./routes/account/org/new');
const getUserAccount = require('./routes/account/user/fetch');
const getOrgAccount = require('./routes/account/org/fetch');
//const orgAudit = require('./routes/audit/org/new');
const updateOrg = require('./routes/account/org/update');
const updateUser = require('./routes/account/user/update');
const newDoc = require('./routes/account/docs/new');
const newFile = require('./routes/account/files/new');
const newForm = require('./routes/account/forms/new');
const teamDocs = require('./routes/account/docs/fetch');
const teamFiles = require('./routes/account/files/fetch');
const teamForms = require('./routes/account/forms/fetch');
const email = require('./communication/email');
const deletedDoc = require('./routes/account/docs/delete');
const deleteFile = require('./routes/account/files/delete');
const deleteUser = require('./routes/account/user/delete');
const jwt = require('jsonwebtoken');
const blockstack = require('blockstack');

require('dotenv').config();
const port = process.env.REACT_APP_SERVER || 5000;

const app = express();
expressOasGenerator.init(app, {
  info: {
    title: "Graphite Pro API", 
    version: "0.1.0",
    description: "Rest API available for all Graphite Pro customers"
  }
});
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

//Posts

/*User*/
app.post('/account/user', async (req, res, next) => {
  const headers = req.headers;
  const decoded = jwt.decode(headers.authorization);
  const pubKey = req.body.pubKey;
  //At some point, need to check for API Key vs Bearer Token
  if(req.body) {
    let updateTeam = false;
    try { 
      if(req.query.updateTeam === 'true') {
        updateTeam = true;
      } 
      const verify = blockstack.verifyProfileToken(headers.authorization, pubKey);
      if(verify) {
        const payload = {
          data: req.body,
          token: decoded
        }
        //First we check if the user exists already
        let fetchData;
        let fetchUser;
        if(req.body.username !==null) {
          fetchData = {
            orgId: req.body.orgId,
            username: req.body.usernam
          }
          fetchUser = await getUserAccount.fetchUser(fetchData);
        } else {
          fetchData = {
            orgId: req.body.orgId,
            id: req.body.id
          }
          fetchUser = await getUserAccount.fetchUserById(fetchData);
        }
        let userAccount;
        let teamData;
        if(fetchUser.message === "No user found") {
          userAccount = await newUserAccount.postNewUser(payload);
          if(updateTeam === true) {
            teamData = await newUserAccount.postToTeam(payload);
            res.send(teamData);
          } else {
            res.send(userAccount);
          }
        } else {
          if(updateTeam === true) {
            teamData = await newUserAccount.postToTeam(payload);
            res.send(teamData);
          } else {
            res.send(userAccount);
          }
        }
      } else {
        res.send({data: "Invalid token"})
      }
    } catch(err) {
      console.log(err)
      res.send(err);
    }
  } else {
    res.send("Error")
  }
})

/*Org*/
app.post('/account/org', async (req, res, next) => {
  const headers = req.headers;
  const decoded = jwt.decode(headers.authorization);
  const pubKey = req.body.pubKey;
  //At some point, need to check for API Key vs Bearer Token
  if(req.body) {
    try { 
      const verify = blockstack.verifyProfileToken(headers.authorization, pubKey);
      if(verify) {
        const submissionData = req.body;
        const newOrg = await newOrgAccount.postSignUp(submissionData, decoded);
        res.send(newOrg);
      } else {
        res.send({data: "Invalid token"});
      }
    } catch(err) {
      res.send("Invalid Token");
    }
  } else {
    res.send("Error")
  }
})

app.post('/account/org/team', async(req, res, next) => {
  const headers = req.headers;
  const decoded = jwt.decode(headers.authorization);
  const pubKey = req.body.pubKey;
  //At some point, need to check for API Key vs Bearer Token
  if(req.body) {
    try { 
      const verify = blockstack.verifyProfileToken(headers.authorization, pubKey);
      if(verify) {
        const submissionData = req.body;
        const team = await updateOrg.postNewTeam(submissionData, decoded);
        res.send(team);
      } else {
        res.send({data: "Invalid token"});
      }
    } catch(err) {
      res.send("Invalid Token");
    }
  } else {
    res.send("Error")
  }
})

/*Documents*/

app.post('/account/organization/:orgId/documents', async function(req, res) {
  const headers = req.headers;
  const decoded = jwt.decode(headers.authorization);
  const pubKey = req.body.pubKey;
  //At some point, need to check for API Key vs Bearer Token
  if(req.body) {
    try { 
      const verify = blockstack.verifyProfileToken(headers.authorization, pubKey);
      if(verify) {
        const data = req.body;
        const doc = await newDoc.postNewDoc(data);
        console.log(doc);
        res.send(doc);
      } else {
        res.send({data: "Invalid token"});
      }
    } catch(err) {
      console.log(err);
      res.send("Error posting document");
    }
  } else {
    res.send("Error")
  }
})

/* Files */
app.post('/account/organization/:orgId/files', async function(req, res) {
  const headers = req.headers;
  const decoded = jwt.decode(headers.authorization);
  const pubKey = req.body.pubKey;
  //At some point, need to check for API Key vs Bearer Token
  if(req.body) {
    try { 
      const verify = blockstack.verifyProfileToken(headers.authorization, pubKey);
      if(verify) {
        const data = req.body;
        const file = await newFile.postNewFile(data);
        console.log(file);
        res.send(file);
      } else {
        res.send({data: "Invalid token"});
      }
    } catch(err) {
      console.log(err);
      res.send("Error posting file");
    }
  } else {
    res.send("Error")
  }
})

/*Forms*/
app.post('/account/organization/:orgId/forms', async function(req, res) {
  const headers = req.headers;
  const decoded = jwt.decode(headers.authorization);
  const pubKey = req.body.pubKey;
  //At some point, need to check for API Key vs Bearer Token
  if(req.body) {
    try { 
      const verify = blockstack.verifyProfileToken(headers.authorization, pubKey);
      if(verify) {
        const data = req.body;
        const form = await newForm.postNewForm(data);
        console.log(form);
        res.send(form);
      } else {
        res.send({data: "Invalid token"});
      }
    } catch(err) {
      console.log(err);
      res.send("Error posting form");
    }
  } else {
    res.send("Error")
  }
});

app.post('/public/organization/:orgId/forms/:formId', async function(req, res) {
  const orgId = req.params.orgId;
  const formId = req.params.formId;
  if(req.body) {
    try {  
        const data = req.body;
        const payload = {
          orgId, 
          formId, 
          responses: data
        }
        const formResponse = await newForm.postNewResponse(payload);
        console.log(formResponse);
        res.send(formResponse);
    } catch(err) {
      console.log(err);
      res.send("Error posting response");
    }
  } else {
    res.send("Error")
  }
});


/*Emails*/

app.post('/emails/invite', async (req, res, next) => {
  const headers = req.headers;
  const pubKey = req.body.userData.pubKey;
  if(req.body) {
    try { 
      const verify = blockstack.verifyProfileToken(headers.authorization, pubKey);
      if(verify) {
        const payload = req.body;
        const invite = await email.sendInviteEmail(payload);
        console.log(invite);
        res.send(invite);
      } else {
        res.send({data: "Invalid token"});
      }
    } catch(err) {
      console.log(err);
      res.send("Invalid Token");
    }
  } else {
    res.send("Error");
  }
})

/*Audits*/
app.post('/audit/org', async (req, res, next) => {
  
})

app.post('/audit/user', async (req, res, next) => {
  
})

//Gets

/*User*/
app.get('/account/org/:orgId/user/:id', async (req, res, next) => {
  const headers = req.headers;
  const decoded = jwt.decode(headers.authorization);
  if(req.body) {
    try {
      const pubKey = req.query.pubKey;
      const verify = blockstack.verifyProfileToken(headers.authorization, pubKey);
      if(verify) {
        //Check if the user requesting data is the same as the target
        if(decoded.claim.username === req.params.id) {
          const payload = {
            username: req.params.id,
            orgId: req.params.orgId
          }
          const userData = await getUserAccount.fetchUser(payload);
          res.send(userData)
        } else {
          //Need admin level or role-specific API key to access other users
          //For now send generic error response
          res.send("To fetch info about other users, please use API Key")
        }
      } else {
        res.send("Invalid Token")
      }
    } catch(err) {
      res.send("Invalid Token")
    }
  } else {
    res.send("No params included");
  }
})

/*Org*/

app.get('/account/org/:id', async (req, res, next) => {
  const headers = req.headers;
  if(headers.authorization) {
    const decoded = jwt.decode(headers.authorization);
    const username = decoded.claim.username;
    if(req.body) {
      try {
        const pubKey = req.query.pubKey;
        const verify = blockstack.verifyProfileToken(headers.authorization, pubKey);
        if(verify) {
          var orgId = req.params.id;
          const orgData = await getOrgAccount.fetchOrg(orgId);
          res.send(orgData);
          //Need to eventually verify this data
          /*******************/
          //const personData = await getUserAccount.fetchUser(username);
          //Need to verify that the user is a member of the org being requested
          // if(personData.data.accountProfile.orgInfo.orgId === req.params.id) {
          //   const orgData = await getOrgAccount.fetchOrg(orgId);
          //   res.send(orgData);
          // } else {
          //   res.status(401);
          //   res.send("Access denied");
          // }
        } else {
          res.send("Invalid Auth Token")
        }
      } catch(err) {
        res.send("Invalid Token");
      }
    } else {
      res.send("No params included");
    }
  } else {
    res.send("Bearer token not supplied");
  }
})

/* Documents */
app.get('/account/organization/:orgId/documents/:teamId', async function(req, res) {
  const headers = req.headers;
  if(headers.authorization) {
    const decoded = jwt.decode(headers.authorization);
    if(req.body) {
      try {
        const pubKey = req.query.pubKey;
        const verify = blockstack.verifyProfileToken(headers.authorization, pubKey);
        if(verify) {
          const orgId = req.params.orgId;
          const teamId = req.params.teamId;
          const docs = await teamDocs.fetchTeamDocs(orgId, teamId);
          res.send(docs);
        } else {
          res.send("Invalid Auth Token")
        }
      } catch(err) {
        console.log(err)
        res.send("Invalid Token");
      }
    } else {
      res.send("No params included");
    }
  } else {
    res.send("No token provided");
  }
});

app.get('/account/organization/:orgId/documents/:teamId/document/:id', function(req, res) {

});

/* Files */
app.get('/account/organization/:orgId/files/:teamId', async function(req, res) {
  const headers = req.headers;
  if(headers.authorization) {
    const decoded = jwt.decode(headers.authorization);
    if(req.body) {
      try {
        const pubKey = req.query.pubKey;
        const verify = blockstack.verifyProfileToken(headers.authorization, pubKey);
        if(verify) {
          const orgId = req.params.orgId;
          const teamId = req.params.teamId;
          const files = await teamFiles.fetchTeamFiles(orgId, teamId);
          res.send(files);
        } else {
          res.send("Invalid Auth Token")
        }
      } catch(err) {
        console.log(err)
        res.send("Invalid Token");
      }
    } else {
      res.send("No params included");
    }
  } else {
    res.send("No token provided");
  }
});

/*Forms*/
app.get('/account/organization/:orgId/teams/:teamId/forms', async function(req, res) {
  const headers = req.headers;
  if(headers.authorization) {
    const decoded = jwt.decode(headers.authorization);
    if(req.body) {
      try {
        const pubKey = req.query.pubKey;
        const verify = blockstack.verifyProfileToken(headers.authorization, pubKey);
        if(verify) {
          const orgId = req.params.orgId;
          const teamId = req.params.teamId;
          const forms = await teamForms.fetchTeamForms(orgId, teamId);
          res.send(forms);
        } else {
          res.send("Invalid Auth Token")
        }
      } catch(err) {
        console.log(err)
        res.send("Invalid Token");
      }
    } else {
      res.send("No params included");
    }
  } else {
    res.send("No token provided");
  }
});

app.get('/public/organization/:orgId/forms/:formId', async function(req, res) {
  const headers = req.headers;
  if(headers.authorization) {
    const decoded = jwt.decode(headers.authorization);
    if(req.body) {
      try {
        const pubKey = req.query.pubKey;
        const verify = blockstack.verifyProfileToken(headers.authorization, pubKey);
        if(verify) {
          const orgId = req.params.orgId;
          const formId = req.params.formId;
          const formResponses = await teamForms.fetchResponses(orgId, formId);
          res.send(formResponses);
        } else {
          res.send("Invalid Auth Token")
        }
      } catch(err) {
        console.log(err)
        res.send("Invalid Token");
      }
    } else {
      res.send("No params included");
    }
  } else {
    res.send("No token provided");
  }
});

app.get('/account/organization/:orgId/forms/:formId', async function(req, res) {
  const headers = req.headers;
  if(req.body) {
    try {
        const orgId = req.params.orgId;
        const formId = req.params.formId;
        const forms = await teamForms.fetchIndividualForm(orgId, formId);
        res.send(forms);
    } catch(err) {
      console.log(err)
      res.send("Error loading form");
    }
  } else {
    res.send("No params included");
  }
});

//Puts

/*Org*/
app.put('/account/org/name/:id', async(req, res, next) => {
  const headers = req.headers;
  const decoded = jwt.decode(headers.authorization);
  const pubKey = req.body.pubKey;
  const username = decoded.claim.username;
  //At some point, need to check for API Key vs Bearer Token
  if(req.body) {
    try { 
      const verify = blockstack.verifyProfileToken(headers.authorization, pubKey);
      if(verify) {
        const data = req.body;
        const org = await updateOrg.updateOrgName(data, decoded);
        console.log(org);
        res.send(org);
        //TODO: Need to come back and add in this security layer
        // const personData = await getUserAccount.fetchUser(username);
        // if(personData.data.accountProfile.orgInfo.orgId === req.params.id) {
        //   const data = req.body;
        //   const org = await updateOrg.updateOrgName(data, decoded);
        //   res.send(org);
        // } else {
        //   res.send("Access denied");
        // }
      } else {
        res.send({data: "Token Verification Failed: Invalid token"});
      }
    } catch(err) {
      res.send("Error With Auth Token");
    }
  } else {
    res.send("Error")
  }
})

app.put('/account/org/plan', async(err, res) => {
  if(err) {
    res.send(err);
  } else {
    const headers = req.headers;
    const decoded = jwt.decode(headers.authorization);
    const pubKey = req.body.pubKey;
    //At some point, need to check for API Key vs Bearer Token
    if(req.body) {
      try { 
        const verify = blockstack.verifyProfileToken(headers.authorization, pubKey);
        if(verify) {
          const submissionData = req.body;
          const org = await updateOrg.updateOrgPlan(submissionData, decoded);
          res.send(org);
        } else {
          res.send({data: "Invalid token"});
        }
      } catch(err) {
        res.send("Invalid Token");
      }
    } else {
      res.send("Error")
    }
  }
})

app.put('/account/org/team/:id', async(err, res) => {
  if(err) {
    res.send(err);
  } else {
    const headers = req.headers;
    const decoded = jwt.decode(headers.authorization);
    const pubKey = req.body.pubKey;
    //At some point, need to check for API Key vs Bearer Token
    if(req.body) {
      try { 
        const verify = blockstack.verifyProfileToken(headers.authorization, pubKey);
        if(verify) {
          const submissionData = req.body;
          const org = await updateOrg.updateOrgTeams(submissionData, decoded);
          res.send(org);
        } else {
          res.send({data: "Invalid token"});
        }
      } catch(err) {
        res.send("Invalid Token");
      }
    } else {
      res.send("Error")
    }
  }
})

app.put('/account/organization/:orgId/user/:id', async (req, res, next) => {
  const headers = req.headers;
  const decoded = jwt.decode(headers.authorization);
  const pubKey = req.body.pubKey;
  const orgId = req.params.orgId;
  const id = req.params.id;
  //At some point, need to check for API Key vs Bearer Token
  if(req.body) {
    try { 
      const verify = blockstack.verifyProfileToken(headers.authorization, pubKey);
      if(verify) {
        const payload = {
          data: req.body,
          token: decoded
        }
        //First we update the user model
        const updatedUserModel = await updateUser.updateUserAccount(payload);
        res.send(updatedUserModel);
      } else {
        res.send({data: "Invalid token"})
      }
    } catch(err) {
      console.log(err)
      res.send(err);
    }
  } else {
    res.send("Error")
  }
})

// Deletes

/*Users*/

//This deletes a user from a particular team
app.delete('/account/organization/:orgId/teams/:teamId/users/:userId', async function(req, res) {
  const headers = req.headers;
  const decoded = jwt.decode(headers.authorization);
  console.log(decoded);
  const pubKey = req.query.pubKey;
  const orgId = req.params.orgId;
  const userId = req.params.userId;
  const teamId = req.params.teamId;
  //At some point, need to check for API Key vs Bearer Token
  if(req.body) {
    try { 
      const verify = blockstack.verifyProfileToken(headers.authorization, pubKey);
      if(verify) {
        //Find and delete the document, thus removing access for the team
        const payload = {
          userId,
          orgId,
          teamId,
          requestingUser: decoded.claim.username
        }
        const user = await deleteUser.deleteFromTeam(payload);
        res.send(user);
      } else {
        res.send({data: "Invalid token"})
      }
    } catch(err) {
      console.log(err)
      res.send(err);
    }
  } else {
    res.send("Error")
  }
});

//This deletes the user from the entire organization
app.delete('/account/organization/:orgId/users/:userId', async function(req, res) {
  const headers = req.headers;
  const decoded = jwt.decode(headers.authorization);
  const pubKey = req.query.pubKey;
  const orgId = req.params.orgId;
  const userId = req.params.userId;
  //At some point, need to check for API Key vs Bearer Token
  if(req.body) {
    try { 
      const verify = blockstack.verifyProfileToken(headers.authorization, pubKey);
      if(verify) {
        //Find and delete the document, thus removing access for the team
        const payload = {
          userId,
          orgId,
          requestingUser: decoded.claim.username
        }
        const user = await deleteUser.deleteFromOrg(payload);
        res.send(user);
      } else {
        res.send({data: "Invalid token"})
      }
    } catch(err) {
      console.log(err)
      res.send(err);
    }
  } else {
    res.send("Error")
  }
});

/*Documents*/
app.delete('/account/organization/:orgId/teams/:teamId/documents/:docId', async function(req, res) {
  const headers = req.headers;
  const decoded = jwt.decode(headers.authorization);
  const pubKey = req.query.pubKey;
  const orgId = req.params.orgId;
  const docId = req.params.docId;
  const teamId = req.params.teamId;
  //At some point, need to check for API Key vs Bearer Token
  if(req.body) {
    try { 
      const verify = blockstack.verifyProfileToken(headers.authorization, pubKey);
      if(verify) {
        //Find and delete the document, thus removing access for the team
        const payload = {
          docId,
          orgId,
          teamId
        }
        const doc = await deletedDoc.delete(payload);
        res.send(doc);
      } else {
        res.send({data: "Invalid token"})
      }
    } catch(err) {
      console.log(err)
      res.send(err);
    }
  } else {
    res.send("Error")
  }
});

/* Files */
app.delete('/account/organization/:orgId/teams/:teamId/files/:fileId', async function(req, res) {
  const headers = req.headers;
  const decoded = jwt.decode(headers.authorization);
  const pubKey = req.query.pubKey;
  const orgId = req.params.orgId;
  const fileId = req.params.fileId;
  const teamId = req.params.teamId;
  //At some point, need to check for API Key vs Bearer Token
  if(req.body) {
    try { 
      const verify = blockstack.verifyProfileToken(headers.authorization, pubKey);
      if(verify) {
        //Find and delete the document, thus removing access for the team
        const payload = {
          fileId,
          orgId,
          teamId
        }
        const file = await deleteFile.delete(payload);
        res.send(file);
      } else {
        res.send({data: "Invalid token"})
      }
    } catch(err) {
      console.log(err)
      res.send(err);
    }
  } else {
    res.send("Error")
  }
});

// our server instance
const server = http.createServer(app);

// This creates our socket using the instance of the server
const io = socketIO(server);

// This is what the socket.io syntax is like, we will work this later
io.on("connection", socket => {
  console.log("User connected");
  socket.on("room", room => {
    socket.leave(socket.room);
    socket.join(room);
    // roomName = room;
    socket.on("update content", content => {
      // console.log(content);
      // once we get a 'update content' event from one of our clients, we will send it to the rest of the clients
      // we make use of the socket.emit method again with the argument given to use from the callback function above
      console.log("Updating content...");
      try {
        io.sockets.in(room).emit("update content", content);
      } catch (e) {
        console.log(e);
      }
    });
  });

  // console.log(io.nsps['/'].adapter.rooms)

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(process.env.PORT || 5000, () => console.log(`Listening on port ${port}`));
