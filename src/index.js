require("dotenv").config();
const express = require("express");
const app = express();

const csvUpload = require("express-fileupload");
const cors = require("cors");
app.use(cors());
app.use(express.json()); // to use req.body

// Mine
const connectToMongoDB = require("./databases/mongodb/config");
connectToMongoDB();

const { createDir } = require("./utilities/helper_functions");
const { vars } = require("./utilities/constants");

// routes
app.use("/api/user/auth", require("./api/routes/user.js"));

app.use("/api/admin/auth", require("./api/routes/admin.js"));

app.use("/api/public", require("./api/routes/public.js"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is listening at port ${PORT}`);

  createDir(vars.imageFile.ORIGINAL_UPLOADS_DIR_PATH);
  createDir(vars.imageFile.COMPRESSED_UPLOADS_DIR_PATH);
});

/*
todo:
while deployment:
make all import like mongodb in lowercase
uncomment createDir
firebase private key error while deployment:
https://stackoverflow.com/questions/50299329/node-js-firebase-service-account-private-key-wont-parse
*/
