const mongoose = require("mongoose");
const { UnitSchema } = require("./Unit");

const CourseSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
    required: true,
  },
  unitArr: {
    type: [UnitSchema], // array of units
    default: [],
  },
});

const Course = mongoose.model("course", CourseSchema);
// Course.createIndexes();
module.exports = Course;
