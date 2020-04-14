const express = require("express");
const connectDB = require("./config/db");
const config = require("config");
const CONTENT_LENGTH_LIMIT = "10mb";

const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");

app.use(cors());

app.use(cookieParser());

//  Connect Database
connectDB(config.get("environment"));

//  Init Middleware
app.use(express.json({ limit: CONTENT_LENGTH_LIMIT, extended: true }));

app.get("/", (req, res) => res.send("API Running"));

//  Define Routes
// app.use('/api/v1/users', require('./routes/v1/users'));
app.use("/v1/auth", require("./routes/v1/auth"));
app.use("/v1/documents", require("./routes/v1/docs"));
// app.use('/api/v1/profile', require('./routes/v1/profile'));
// app.use('/api/v1/submissions', require('./routes/v1/submissions'));
// app.use('/api/v1/uploads', require('./routes/v1/uploads'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
