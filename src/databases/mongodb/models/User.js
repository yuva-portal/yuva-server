const mongoose = require("mongoose");

const UserSchema = mongoose.Schema(
  {
    fName: {
      type: String,
      required: [true, "First name is required"],
      minLength: [1, "First name is too short"],
      maxLength: [60, "First name is too long"],
      trim: true,
    },
    mName: {
      type: String,
      default: "",
      maxLength: [60, "Middle name is too long"],
      trim: true,
    },
    lName: {
      type: String,
      required: [true, "Last name is required"],
      minLength: [1, "Last name is too short"],
      maxLength: [60, "Last name is too long"],
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
      // minLength: [1, "Password is too short"],
      trim: true,
      // no maxlen here as we store hashed password which is too long, only maxlen on client side
      // todo: put a custom password policy validator here, google srch this, pass will be hashed and then stored therefore no maxLen
    },

    //////////////////////
    activity: {
      type: Object,
      default: {},
    },
    collegeName: {
      type: String,
      required: true,
      minLength: [1, "College name is too short"],
      maxLength: [120, "College name is too long"],
      trim: true,
    },
    region: {
      type: String,
      required: true,
      minLength: [1, "Region is too short"],
      maxLength: [60, "Region is too long"],
      trim: true,
    },
    branch: {
      type: String,
      required: true,
      minLength: [1, "Branch is too short"],
      maxLength: [60, "Branch is too long"],
      trim: true,
    },
    //////////////////////////

    // todo: phone maxlen
    phone: {
      type: String,
      required: true,
      minLength: [1, "Phone is too short"],
      maxLength: [20, "Phone is too long"],
      trim: true,
    },
    addLine1: {
      type: String,
      required: true,
      minLength: [1, "Address Line 1 is too short"],
      maxLength: [120, "Address Line 1 is too long"],
      trim: true,
    },
    addLine2: {
      type: String,
      required: true,
      minLength: [1, "Address Line 2 is too short"],
      maxLength: [120, "Address Line 2 is too long"],
      trim: true,
    },
    city: {
      type: String,
      required: true,
      minLength: [1, "City name is too short"],
      maxLength: [60, "City name is too long"],
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      minLength: [1, "Pincode is too short"],
      maxLength: [10, "Pincode is too long"],
      trim: true,
    },
    country: {
      type: String,
      required: true,
      minLength: [1, "Country name is too short"],
      maxLength: [60, "Country name is too long"],
      trim: true,
    },
  },
  { minimize: false }
);

/*
 minimize: false, so empty object is assigned to activity in user doc on registration
 */

const User = mongoose.model("user", UserSchema);
User.createIndexes();
module.exports = User;

// is default value possible for activity ?
