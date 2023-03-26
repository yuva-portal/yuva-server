const express = require("express");
const router = express.Router();
const { default: mongoose } = require("mongoose");
require("dotenv").config();

const { parse } = require("csv-parse");
const csvUpload = require("express-fileupload");

// My models
const Admin = require("../../databases/mongodb/models/Admin");
const Vertical = require("../../databases/mongodb/models/Vertical");
const Course = require("../../databases/mongodb/models/Course");

const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");

// My utilities
const { vars } = require("../../utilities/constants.js");
const statusText = require("../../utilities/status_text.js");
const { fetchPerson, isAdmin } = require("../../middlewares");

///////////////////////////////////////////////////////////////////////////////////////////////////

// ! remove extra routes

router.post("/dummy", async (req, res) => {
  //   console.log(req);

  try {
    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(req.body.password, salt);
    req.body.password = newHashedPassword;

    await Admin.create(req.body);
    res.status(200).json({ statusText: statusText.LOGIN_IN_SUCCESS });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: statusText.INTERNAL_SERVER_ERROR });
  }
});

router.post("/verify-token", fetchPerson, isAdmin, async (req, res) => {
  res.status(200).json({ statusText: statusText.SUCCESS });
});

//////////////////////////////////////// LOGIN ////////////////////////////////////////////////

router.post("/login", async (req, res) => {
  // todo : validation

  const adminId = req.body.adminId; // mongo works even if adminId and pass is an empty or undefined
  const enteredPassword = req.body.password;

  try {
    // match creds
    const adminDoc = await Admin.findOne({ adminId: adminId });
    if (!adminDoc) {
      // wrong adminId
      return res
        .status(401)
        .json({ statusText: statusText.INVALID_CREDS, areCredsInvalid: true });
    }

    const hashedPassword = adminDoc.password;

    const isPasswordMatched = await bcrypt.compare(
      enteredPassword,
      hashedPassword
    );

    if (!isPasswordMatched) {
      // wrong password
      return res
        .status(400)
        .json({ statusText: statusText.INVALID_CREDS, areCredsInvalid: true });
    }

    // generate token
    const data = {
      exp: Math.floor(Date.now() / 1000) + vars.token.expiry.ADMIN_IN_SEC,
      person: {
        mongoId: adminDoc._id,
        role: "admin",
      },
    };

    const token = jwt.sign(data, process.env.JWT_SECRET);

    res
      .status(200)
      .json({ statusText: statusText.LOGIN_IN_SUCCESS, token: token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusText: statusText.INTERNAL_SERVER_ERROR });
  }
});

/////////////////////////////////////////// All //////////////////////////////////////////

router.get("/verticals/all", fetchPerson, isAdmin, async (req, res) => {
  // console.log(req.originalUrl);

  try {
    const allVerticals = await Vertical.find();
    // console.log(allVerticals);

    res
      .status(200)
      .json({ statusText: statusText.SUCCESS, allVerticals: allVerticals });
  } catch (err) {
    // console.log(err.message);
    res.status(500).json({ statusText: statusText.FAIL });
  }
});

//! validated
router.get(
  "/verticals/:verticalId/courses/all",
  fetchPerson,
  isAdmin,
  async (req, res) => {
    const { verticalId } = req.params;
    // verticalId = null;

    try {
      const verticalDoc = await Vertical.findById(verticalId);

      if (!verticalDoc) {
        return res
          .status(404)
          .json({ statusText: statusText.VERTICAL_NOT_FOUND });
      }

      // console.log(verticalDoc);

      const allCourses = await Course.find({
        _id: { $in: verticalDoc.courseIds },
      });
      // console.log(allCourses);

      res
        .status(200)
        .json({ statusText: statusText.SUCCESS, allCourses: allCourses });
    } catch (err) {
      // console.log(err);
      res.status(500).json({ statusText: statusText.FAIL });
    }
  }
);

router.get(
  "/verticals/:verticalId/courses/:courseId/units/all",
  fetchPerson,
  isAdmin,
  async (req, res) => {
    // todo : validation
    // console.log(req.originalUrl);

    const { courseId } = req.params;

    try {
      const courseDoc = await Course.findById(courseId);

      if (!courseDoc) {
        return res
          .status(404)
          .json({ statusText: statusText.COURSE_NOT_FOUND });
      }

      // console.log(courseDoc);

      res
        .status(200)
        .json({ statusText: statusText.SUCCESS, allUnits: courseDoc.unitArr });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ statusText: statusText.FAIL });
    }
  }
);

/////////////////////////////////////////// ADD ///////////////////////////////////////////

//! validated
router.post("/verticals/add", fetchPerson, isAdmin, async (req, res) => {
  // no validation needed mongodb will handle even if name, desc, src is null/empty
  // console.log(req.body);
  // const { name, desc, imgSrc } = req.body;

  try {
    await Vertical.create(req.body);
    res.status(200).json({ statusText: statusText.VERTICAL_CREATE_SUCCESS });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ statusText: statusText.INTERNAL_SERVER_ERROR });
  }
});

//! validated, doubt
router.post(
  "/verticals/:verticalId/courses/add",
  fetchPerson,
  isAdmin,
  async (req, res) => {
    // todo : validation
    const { verticalId } = req.params;

    try {
      const courseDoc = await Course.create(req.body);
      // console.log(courseDoc);

      const verticalDoc = await Vertical.findOneAndUpdate(
        { _id: verticalId },
        { $push: { courseIds: courseDoc._id } },
        { new: true }
      );

      if (!verticalDoc) {
        return res
          .status(404)
          .json({ statusText: statusText.VERTICAL_NOT_FOUND });
      }

      // console.log(verticalDoc); // new = true to return the updated doc

      res.status(200).json({ statusText: statusText.COURSE_CREATE_SUCCESS });
    } catch (err) {
      // console.error(err.message);
      res.status(500).json({ statusText: statusText.INTERNAL_SERVER_ERROR });
    }
  }
);

// ! validated, doubt
router.post(
  "/verticals/:verticalId/courses/:courseId/units/add",
  fetchPerson,
  isAdmin,
  async (req, res) => {
    // console.log(req.originalUrl);

    // todo : validation
    let unit = req.body;
    let { courseId } = req.params;

    // ! manually check and add field in unit doc
    // unit = {
    //   video: {
    //     title: "a",
    //     desc: "a",
    //     vdoSrc: "",
    //   },
    // };

    // courseId = "640186d18eb87edf965c9941";

    try {
      const courseDoc = await Course.findOneAndUpdate(
        { _id: courseId },
        { $push: { unitArr: unit } },
        { new: true }
      );

      if (!courseDoc) {
        return res
          .status(404)
          .json({ statusText: statusText.COURSE_NOT_FOUND });
      }

      // console.log(courseDoc); // new = true to return the updated doc

      res.status(200).json({ statusText: statusText.UNIT_CREATE_SUCCESS });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ statusText: statusText.INTERNAL_SERVER_ERROR });
    }
  }
);

//////////////////////////////////////// DELETE //////////////////////////////////////////

//! validated
router.delete(
  "/verticals/:verticalId/delete",
  fetchPerson,
  isAdmin,
  async (req, res) => {
    // no validation needed mongodb will handle even if verticalId is null(404)/empty string

    // todo : validation
    const { verticalId } = req.params;

    try {
      const verticalDoc = await Vertical.findByIdAndDelete(verticalId); // returns the doc just before deletion
      // console.log(verticalDoc);

      if (!verticalDoc) {
        return res
          .status(404)
          .json({ statusText: statusText.VERTICAL_NOT_FOUND });
      }

      await Course.deleteMany({
        _id: { $in: verticalDoc.courseIds },
      });

      res.status(200).json({ statusText: statusText.VERTICAL_DELETE_SUCCESS });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ statusText: statusText.INTERNAL_SERVER_ERROR });
    }
  }
);

//! validated
router.delete(
  "/verticals/:verticalId/courses/:courseId/delete",
  fetchPerson,
  isAdmin,
  async (req, res) => {
    // todo : validation

    const { verticalId, courseId } = req.params;
    // console.log(courseId);

    const objectCourseId = mongoose.Types.ObjectId(courseId); // imp to convert to string to objectId

    try {
      const courseDoc = await Course.findByIdAndDelete(courseId);
      // console.log(courseDoc);

      if (!courseDoc) {
        return res
          .status(404)
          .json({ statusText: statusText.COURSE_NOT_FOUND });
      }

      const verticalDoc = await Vertical.findOneAndUpdate(
        { _id: verticalId },
        {
          $pull: {
            courseIds: { $in: [objectCourseId] },
          },
        },
        { new: true }
      );
      // new = true to return updated doc

      // console.log(verticalDoc);

      res.status(200).json({ statusText: statusText.COURSE_DELETE_SUCCESS });
    } catch (err) {
      // console.error(err.message);
      res.status(500).json({ statusText: statusText.INTERNAL_SERVER_ERROR });
    }
  }
);

//! validated
router.delete(
  "/verticals/:verticalId/courses/:courseId/units/:unitId/delete",
  fetchPerson,
  isAdmin,
  async (req, res) => {
    // todo : validation
    const { verticalId, courseId, unitId } = req.params;
    const unitObjectId = mongoose.Types.ObjectId(unitId);

    try {
      const courseDoc = await Course.findOneAndUpdate(
        { _id: courseId },
        {
          $pull: {
            unitArr: { _id: unitObjectId },
          },
        },
        { new: true }
      );

      if (!courseDoc) {
        return res
          .status(404)
          .json({ statusText: statusText.COURSE_NOT_FOUND });
      }

      console.log(courseDoc.unitArr.length);

      res.status(200).json({ statusText: statusText.UNIT_DELETE_SUCCESS });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ statusText: statusText.INTERNAL_SERVER_ERROR });
    }
  }
);

// router.post("/add-users", csvUpload(), async (req, res) => {
//   console.log(req.originalUrl);
//   // ! todo: SEND MAILS

//   try {
//     const input = req.files.userCreds.data; // csvUploads (in index.js) file adds file to req.files
//     const options = {};
//     parse(input, options, (err, records) => {
//       if (err) {
//         console.log(err);
//         res.status(500).json({ error: statusText.INTERNAL_SERVER_ERROR });
//       } else {
//         console.log(records);

//         try {
//           // create users and send bulk emails
//         } catch (err) {
//           console.log(err);
//         }
//         res.status(200).json({ statusText: statusText.SUCCESS });
//       }
//     });
//   } catch (err) {
//     console.log(err.message);
//     res.status(500).json({ error: statusText.INTERNAL_SERVER_ERROR });
//   }
// });

module.exports = router;
