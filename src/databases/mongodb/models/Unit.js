const mongoose = require("mongoose");

const UnitSchema = mongoose.Schema({
  video: {
    title: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      default: "",
    },
    vdoSrc: { type: String, required: true },
  },
  text: {
    type: String,
    default: "",
  },
  activities: {
    type: Array,
    default: [],
  },
  quiz: {
    type: Array,
    default: [],
  },
});

const Unit = mongoose.model("unit", UnitSchema);

module.exports = { Unit, UnitSchema };
