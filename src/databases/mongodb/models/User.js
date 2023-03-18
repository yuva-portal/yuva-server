const mongoose = require("mongoose");
// const { Schema } = require("mongoose");
// todo: validation

const UserSchema = mongoose.Schema({
  fName: {
    type: String,
    required: [true, "First name is required"],
    minLength: [1, "First name is too short"],
    maxLength: [50, "First name is too long"],
    trim: true,
  },
  mName: {
    type: String,
    // minLength: [1, "Middle name is too short"],
    maxLength: [50, "Middle name is too long"],
    trim: true,
  },
  lName: {
    type: String,
    required: [true, "Last name is required"],
    minLength: [1, "Last name is too short"],
    maxLength: [50, "Last name is too long"],
    trim: true,
  },

  ////////////////////////
  email: {
    type: String,
    required: true,
    // unique: true,
    trim: true,
    // todo: put a custom email syntax validator here, google srch this
  },
  userId: {
    type: String,
    required: true,
    unique: true,
    minLength: [1, "User Id is too short"],
    maxLength: [30, "User Id is too long"],
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minLength: [1, "Password is too short"],
    trim: true,
    // todo: put a custom password policy validator here, google srch this, pass will be hashed and then stored therefore no maxLen
  },

  //////////////////////
  activity: {
    type: Object,
  },
  collegeName: {
    type: String,
    minLength: [1, "College name is too short"],
    maxLength: [120, "College name is too long"],
    trim: true,
  },
  region: {
    type: String,
    minLength: [1, "Region is too short"],
    maxLength: [50, "Region is too long"],
    trim: true,
  },
  branch: {
    type: String,
    minLength: [1, "Branch is too short"],
    maxLength: [50, "Branch is too long"],
    trim: true,
  },
  //////////////////////////

  phone: {
    type: String,
    minLength: [1, "Phone is too short"],
    maxLength: [12, "Phone is too long"],
    trim: true,
  },
  addLine1: {
    type: String,
    minLength: [1, "Address Line 1 is too short"],
    maxLength: [120, "Address Line 1 is too long"],
    trim: true,
  },
  addLine2: {
    type: String,
    minLength: [1, "Address Line 2 is too short"],
    maxLength: [120, "Address Line 2 is too long"],
    trim: true,
  },
  city: {
    type: String,
    minLength: [1, "City is too short"],
    maxLength: [50, "City is too long"],
    trim: true,
  },
  pincode: {
    type: String,
    minLength: [1, "Pincode is too short"],
    maxLength: [10, "Pincode is too long"],
    trim: true,
  },
  country: {
    type: String,
    minLength: [1, "Country is too short"],
    maxLength: [50, "Country is too long"],
    trim: true,
  },
});

const User = mongoose.model("user", UserSchema);
User.createIndexes();
module.exports = User;

// is default value possible for activity ?
