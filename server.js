const express = require("express");
const connectDB = require("./config/db");
const fileUpload = require('express-fileupload');
const config = require("config");
const CONTENT_LENGTH_LIMIT = "10mb";

const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");

app.use(cors());
app.use(fileUpload());
app.use(cookieParser());

//  Connect Database
connectDB(config.get("environment"));

//  Stripe payment route requires raw unparsed body. So, we have to use it here 
//  Before the bodyparser middleware. See more here: https://github.com/stripe/stripe-node/issues/356
app.use("/v1/payment", require("./routes/v1/payment"));

//  Init Middleware
app.use(express.json({ limit: CONTENT_LENGTH_LIMIT, extended: true }));

app.get("/", (req, res) => res.send("API Running"));

//  Define Routes
app.use("/v1/auth", require("./routes/v1/auth"));
app.use("/v1/documents", require("./routes/v1/docs"));
app.use("/v1/organizations", require("./routes/v1/orgs"));
app.use("/v1/profile", require("./routes/v1/profile"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
