const mongoose = require("mongoose");

const AdminSchema = mongoose.Schema({
  fName: {
    type: String,
  },
  mName: {
    type: String,
  },
  lName: {
    type: String,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },
  adminId: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
  },
});
const Admin = mongoose.model("admin", AdminSchema);
// Admin.createIndexes();
module.exports = Admin;
