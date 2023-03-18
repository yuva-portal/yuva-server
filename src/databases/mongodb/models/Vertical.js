const mongoose = require("mongoose");

const VerticalSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
    required: true,
  },
  courseIds: {
    type: Array,
    default: [],
  },
  imgSrc: {
    type: String,
    default:
      "https://images.unsplash.com/photo-1671989088481-e1e045dbdd20?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80",
  },
});

// todo: imgSrc, indexing

const Vertical = mongoose.model("vertical", VerticalSchema);
module.exports = Vertical;
