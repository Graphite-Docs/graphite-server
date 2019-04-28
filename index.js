const express = require("express");
const expressOasGenerator = require('express-oas-generator');
var cors = require('cors')
const http = require("http");
const socketIO = require("socket.io");
const newUserAccount = require('./routes/account/user/new');
const newOrgAccount = require('./routes/account/org/new');
const getUserAccount = require('./routes/account/user/fetch');
const getOrgAccount = require('./routes/account/org/fetch');
const jwt = require('jsonwebtoken');
const blockstack = require('blockstack');

require('dotenv').config()
const port = process.env.REACT_APP_SERVER || 5000;

const app = express();
expressOasGenerator.init(app, {});
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
  if(req.body) {
    try { 
      const verify = blockstack.verifyProfileToken(headers.authorization, pubKey);
      if(verify) {
        const submissionData = req.body;
        const trialAccount = await newUserAccount.postSignUp(submissionData, decoded);
        res.send(trialAccount);
      } else {
        res.send({data: "Invalid token"})
      }
    } catch(err) {
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
      res.send(err);
    }
  } else {
    res.send("Error")
  }
})

//Gets

/*User*/
app.get('/account/user/:id', async (req, res, next) => {
  var username = req.params.id;
  const userData = await getUserAccount.fetchUser(username);
  res.send(userData)
})

/*Org*/

app.get('/account/org/:id', async (req, res, next) => {
  var orgName = req.params.id;
  const orgData = await getOrgAccount.fetchOrg(orgName);
  res.send(orgData);
})

//Puts

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
