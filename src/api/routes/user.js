const express = require("express");
const router = express.Router();
// require("dotenv").config();
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const sharp = require("sharp");

// My models
const User = require("../../databases/mongodb/models/User");
const Vertical = require("../../databases/mongodb/models/Vertical");
const Course = require("../../databases/mongodb/models/Course");

// My middlewares
const {
  fetchPerson,
  isUser,
  arePrereqSatisfied,
  isEligibleToTakeQuiz,
} = require("../../middlewares");

// My utilities
const statusText = require("../../utilities/status_text.js");
const { vars } = require("../../utilities/constants.js");
const {
  encodeCertificateId,
  generateFirebasePublicURL,
  getUserActivityDefaultObj,
  addRequiredUnitActivity,
  isRequiredUnitActivityPresent,
} = require("../../utilities/helper_functions.js");

/******************** My Configs **********************/
// Multer
const upload = require("../../config/multer_config");
// console.log(upload);

// Firebase
const bucket = require("../../databases/firebase/config");

// ! Dont bind data to req, bind them to res, change this at all routes and middlewares reference: https://stackoverflow.com/questions/18875292/passing-variables-to-the-next-middleware-using-next-in-express-js
// todo: only send statusText and not error field in response

/////////////////////////////////////////////////////////////////////////////////////////////////

router.post("/dummy", async (req, res) => {
  console.log(req);
  console.log("skfjnksnsf");
  try {
    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(req.body.password, salt);
    req.body.password = newHashedPassword;

    await User.create(req.body);
    res.status(200).json({ statusText: statusText.LOGIN_IN_SUCCESS });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: statusText.INTERNAL_SERVER_ERROR });
  }
});

///////////////////////////////////////////// Auth //////////////////////////////////////////////////////

router.post("/login", async (req, res) => {
  // todo : validation
  // console.log(req.originalUrl);
  console.log(req.body);

  const userId = req.body.userId;
  const enteredPassword = req.body.password;
  try {
    // match creds
    const user = await User.findOne({ userId: userId });

    if (!user) {
      // wrong userId
      return res
        .status(401)
        .json({ statusText: statusText.INVALID_CREDS, areCredsInvalid: true });
    }

    const hashedPassword = user.password;

    const passwordCompare = await bcrypt.compare(
      enteredPassword,
      hashedPassword
    );

    if (!passwordCompare) {
      // wrong password
      return res
        .status(401)
        .json({ statusText: statusText.INVALID_CREDS, areCredsInvalid: true });
    }

    // generate token
    const data = {
      person: {
        mongoId: user._id,
        role: "user",
      },
    };

    const token = jwt.sign(data, process.env.JWT_SECRET);

    res
      .status(200)
      .json({ statusText: statusText.LOGIN_IN_SUCCESS, token: token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ statusText: statusText.INTERNAL_SERVER_ERROR });
  }
});

router.post("/check-userid-availability", async (req, res) => {
  const desiredUserId = req.body.userId;

  try {
    const userDoc = await User.findOne({ userId: desiredUserId });

    if (!userDoc) {
      res.status(200).json({
        statusText: statusText.USER_ID_AVAILABLE,
        isUserIdAvailable: true,
      });
    } else {
      res.status(200).json({
        statusText: statusText.USER_ID_NOT_AVAILABLE,
        isUserIdAvailable: false,
      });
    }
  } catch (err) {
    console.log(err.message);

    res.status(500).json({ error: statusText.INTERNAL_SERVER_ERROR });
  }
});

router.post("/register", async (req, res) => {
  console.log(req.originalUrl);
  // manual validation not required, mongooose validation running

  const regisForm = req.body;

  console.log(regisForm);

  /* 
  todo:
  regisForm contains an extra field cnfrmPass but only the fields in the schema will be saved by mongoose
  we can remove the field for extra safety
  */

  try {
    // hash password and update form
    const salt = await bcrypt.genSalt(vars.bcryptSaltRounds);
    regisForm.password = await bcrypt.hash(regisForm.password, salt);

    await User.create(regisForm);

    res.status(200).json({ statusText: statusText.REGISTRATION_SUCCESS });
  } catch (err) {
    console.log(err);
    //! note: todo.txt contains the ways to get only the first error from mongoose so that we can return it directly to client
    res.status(500).json({ statusText: statusText.INTERNAL_SERVER_ERROR });
  }
});

router.post("/reset-password", fetchPerson, isUser, async (req, res) => {
  // user is already logged in, so we dont need userId
  // console.log(req.originalUrl);

  const { currPassword, newPassword } = req.body;
  const mongoId = req.mongoId;

  try {
    const userDoc = await User.findById(mongoId);

    if (userDoc.isPassReset) {
      return res
        .status(403)
        .json({ statusText: statusText.PASS_RESET_ALREADY, isPassReset: true });
    }

    const hashedPassword = userDoc.password;
    const passwordCompare = await bcrypt.compare(currPassword, hashedPassword);

    if (!passwordCompare) {
      return res.status(401).json({
        statusText: statusText.CURRENT_PASS_INCORRECT,
        isCurrPasswordIncorrect: true,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(
      mongoId,
      { password: newHashedPassword, isPassReset: true },
      { overwrite: false }
    );

    res.status(200).json({ statusText: statusText.PASS_RESET_SUCCESS });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ statusText: statusText.INTERNAL_SERVER_ERROR });
  }
});

router.post("/verify-token", fetchPerson, isUser, async (req, res) => {
  // console.log(req.originalUrl);

  try {
    const userDoc = await User.findById(req.mongoId);
    return res
      .status(200)
      .json({ statusText: statusText.VERIFIED_TOKEN, userDoc: userDoc });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ statusText: statusText.INTERNAL_SERVER_ERROR });
  }
});

/////////////////////////////////////// All ///////////////////////////////////////////////

router.get("/verticals/all", async (req, res) => {
  // todo: verify role, reason: a student can paste the url on browser and potray himself as an admin
  // console.log(req.originalUrl);

  try {
    const allVerticals = await Vertical.find();
    // console.log(allVerticals);

    res.status(200).json({
      statusText: statusText.SUCCESS,
      allVerticals: allVerticals,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ statusText: statusText.FAIL });
  }
});

router.get(
  "/verticals/:verticalId/courses/all",
  fetchPerson,
  isUser,
  async (req, res) => {
    console.log(req.originalUrl);

    const { verticalId } = req.params;

    try {
      const vertical = await Vertical.findById(verticalId);
      // console.log(vertical);

      const allCourses = await Course.find({
        _id: { $in: vertical.courseIds },
      });
      // console.log(allCourses.length);

      res.status(200).json({
        statusText: statusText.SUCCESS,
        allCourses: allCourses,
        userDoc: req.userDoc,
        verticalDoc: { name: vertical.name, desc: vertical.desc },
      });
    } catch (error) {
      // console.log(error);
      res.status(400).json({ statusText: statusText.FAIL });
    }
  }
);

router.get(
  "/verticals/:verticalId/courses/:courseId/units/all",
  fetchPerson,
  isUser,
  async (req, res) => {
    // todo : validation

    const { courseId } = req.params;

    try {
      const courseDoc = await Course.findById(courseId);

      // console.log(courseDoc);

      res.status(200).json({
        statusText: statusText.SUCCESS,
        allUnits: courseDoc.unitArr,
        courseDoc: { name: courseDoc.name, desc: courseDoc.desc },
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: statusText.INTERNAL_SERVER_ERROR });
    }
  }
);

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

// ! need to verify whether coursedoc exists or not

router.get(
  "/verticals/:verticalId/courses/:courseId/units/:unitId",
  fetchPerson,
  isUser,
  async (req, res) => {
    // todo : validation
    // console.log(req.originalUrl);

    const { verticalId, courseId, unitId } = req.params;
    const mongoId = req.mongoId;

    try {
      // find course and then the required unit from the unitArr of that course
      const courseProj = {
        name: 1,
        unitArr: 1,
      };

      const courseDoc = await Course.findById(courseId, courseProj);

      let unit = null;
      courseDoc.unitArr.forEach((singleUnit) => {
        if (singleUnit._id == unitId) {
          unit = singleUnit;
        }
      });

      const userProj = {
        fName: 1,
        mName: 1,
        lName: 1,
        activity: 1,
      };

      // find user doc and decide whether user is eligible to take quiz  or get certificate
      // cannot use middleware here because if he is not eligible then we just need to disable btn and display the page too

      const userDoc = await User.findById(mongoId, userProj);

      let isEligibleToTakeQuiz = false;
      let isCertGenerated = false;

      /* 
      we dont want to put values in isEligibleToTakeQuiz, isCertGenerated by comparing with default values 
      like scoreInPercent which is -1, because what to keep as default values might change in the future
      */
      if (
        isRequiredUnitActivityPresent(userDoc, verticalId, courseId, unitId)
      ) {
        const unitActivity =
          userDoc.activity[`v${verticalId}`][`c${courseId}`][`u${unitId}`];

        isEligibleToTakeQuiz =
          unitActivity.video.watchTimeInPercent >=
          vars.activity.MIN_WATCH_TIME_IN_PERCENT;

        isCertGenerated =
          unitActivity.quiz.scoreInPercent >=
          vars.activity.CERTIFICATE_GENERATION_CUT_OFF_IN_PERCENT;
      } else {
        // add default unit activity field to the user doc
        addRequiredUnitActivity(userDoc, verticalId, courseId, unitId);
      }

      // we need courseInfo and userInfo for the "Get certificate button" which redirects on the cert's url and url contains courseId, unitId, userId

      res.status(200).json({
        statusText: statusText.SUCCESS,
        certId: encodeCertificateId(
          userDoc._id,
          verticalId,
          courseDoc._id,
          unit._id
        ),
        unit: unit,
        isEligibleToTakeQuiz: isEligibleToTakeQuiz,
        isCertGenerated: isCertGenerated,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ statusText: statusText.INTERNAL_SERVER_ERROR });
    }
  }
);

router.post(
  "/verticals/:verticalId/courses/:courseId/units/:unitId/video/update-progress",
  fetchPerson,
  isUser,
  arePrereqSatisfied,
  async (req, res) => {
    const { verticalId, courseId, unitId } = req.params;
    const { vdoWatchTimeInPercent } = req.body;
    console.log(vdoWatchTimeInPercent);
    const mongoId = req.mongoId;

    try {
      const userDoc = await User.findById(mongoId);

      addRequiredUnitActivity(userDoc, verticalId, courseId, unitId);

      // ! what if we deleted just the watchtime field in mongodb doc manually
      // userDoc.activity[`v${verticalId}`][`c${courseId}`][
      //   `u${unitId}`
      // ].video.watchTimeInPercent += vdoWatchTimeInPercent;

      const unitActivity =
        userDoc.activity[`v${verticalId}`][`c${courseId}`][`u${unitId}`];

      unitActivity.video.watchTimeInPercent += vdoWatchTimeInPercent;

      const updatedDoc = await User.findByIdAndUpdate(mongoId, userDoc, {
        new: true,
      });
      // console.log(updatedDoc);

      res.status(200).json({ statusText: statusText.SUCCESS });
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ error: statusText.INTERNAL_SERVER_ERROR });
    }
  }
);

router.get(
  "/verticals/:verticalId/courses/:courseId/units/:unitId/quiz",
  fetchPerson,
  isUser,
  arePrereqSatisfied,
  isEligibleToTakeQuiz,
  async (req, res) => {
    // todo : validation, make a middleware isEligibleToTakeQuiz
    // console.log(req.originalUrl);

    const { verticalId, courseId, unitId } = req.params;
    const mongoId = req.mongoId;

    try {
      const courseProj = {
        _id: 0,
        unitArr: 1,
      };

      // todo: check whether courseDoc or unitDoc exists and return 404 if not found
      const courseDoc = await Course.findById(courseId, courseProj);
      //   console.log(courseDoc.unitArr.length);

      let unit = null;
      courseDoc.unitArr.forEach((singleUnit) => {
        if (singleUnit._id == unitId) {
          unit = singleUnit;
        }
      });

      let userProj = {
        _id: 0,
        activity: 1,
      };

      const userDoc = await User.findById(mongoId, userProj);
      const unitActivity =
        userDoc.activity[`v${verticalId}`][`c${courseId}`][`u${unitId}`];

      /* no need to create any default unit activity field, as isEligibleToTakeQuiz middleware has been satisfied, 
      this means vdo watched, this means unit activity exists already
      */
      res.status(200).json({
        statusText: statusText.SUCCESS,
        quiz: unit.quiz,
        isEligibleToTakeQuiz: true,
        quizScoreInPercent: unitActivity.quiz.scoreInPercent,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: statusText.INTERNAL_SERVER_ERROR });
    }
  }
);

router.post(
  "/verticals/:verticalId/courses/:courseId/units/:unitId/quiz/submit",
  fetchPerson,
  isUser,
  arePrereqSatisfied,
  isEligibleToTakeQuiz,
  async (req, res) => {
    // todo : validation, make a middleware isEligibleToTakeQuiz
    // console.log(req.originalUrl);

    const { verticalId, courseId, unitId } = req.params;
    const { quizScoreInPercent } = req.body;
    const mongoId = req.mongoId;

    try {
      const userDoc = await User.findById(mongoId);

      /* no need to create any default unit activity field, as isEligibleToTakeQuiz middleware has been satisfied 
      (to visit the quiz page which contains the submit button), this means vdo watched and this means 
      unit activity exists already
      */

      // always update by creating a new doc for activity out of the previous one

      // check cutoff on quiz submit only, the user can always see the quiz page (except watchtime criteria)
      let hasPassedQuiz = false;
      let hasPassedQuizFirstTime = false;
      const unitActivity =
        userDoc.activity[`v${verticalId}`][`c${courseId}`][`u${unitId}`];

      if (
        unitActivity.quiz.scoreInPercent < vars.activity.QUIZ_CUT_OFF_IN_PERCENT
      ) {
        // user hasn't passed quiz before, now only we can update the score

        // update the score
        unitActivity.quiz = {
          scoreInPercent: quizScoreInPercent,
          passingDate: new Date().toISOString(),
        };

        if (
          quizScoreInPercent >=
          vars.activity.CERTIFICATE_GENERATION_CUT_OFF_IN_PERCENT
        ) {
          hasPassedQuiz = true;
          hasPassedQuizFirstTime = true;
        }

        const updatedDoc = await User.findByIdAndUpdate(mongoId, userDoc, {
          new: true,
        });
        console.log(updatedDoc);
      } else {
        // user has passed quiz before
        hasPassedQuiz = true;
        console.log("Quiz passed already, no update in score");
      }

      console.log(hasPassedQuiz, hasPassedQuizFirstTime);

      res.status(200).json({
        statusText: statusText.SUCCESS,
        hasPassedQuiz: hasPassedQuiz,
        hasPassedQuizFirstTime: hasPassedQuizFirstTime,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: statusText.INTERNAL_SERVER_ERROR });
    }
  }
);

const { unlink } = require("node:fs/promises");

router.post(
  "/verticals/:verticalId/courses/:courseId/units/:unitId/activity/submit",
  fetchPerson,
  isUser,
  upload.single("activityImg"),
  async (req, res) => {
    // todo: verify whether such an unit exists, as on android someone might request this route with any unit id
    // todo: if multiple submits are allowed we need to delete the older one from firebase, or we can allow atmost 2 submits per activity
    // we recieve req.body and req.file due to multer
    // console.log(req.file);
    const fileName = req.file.filename;
    const originalFilePath = req.file.path;
    const compressedFilePath = `uploads/compressed/${fileName}`;

    try {
      // compress file from 'original-file-path' to 'compressed-file-path'
      const compressResult = await sharp(originalFilePath)
        .resize({
          width: vars.imageFile.COMPRESS_IMG_WIDTH_IN_PX,
          fit: sharp.fit.contain,
        })
        .jpeg({ quality: 90 })
        .toFile(compressedFilePath);

      // console.log(compressResult);

      // unlink original file
      await unlink(originalFilePath);

      // upload compressed file to firebase, with downloadToken = fileName

      const firebaseFileDownloadToken = fileName;
      const metadata = {
        metadata: {
          firebaseStorageDownloadTokens: firebaseFileDownloadToken,
        },
        contentType: "image/jpeg",
        cacheControl: "public, max-age=31536000",
      };

      // Upload compressed file to the bucket
      const result = await bucket.upload(compressedFilePath, {
        gzip: true,
        metadata: metadata,
      });

      // console.log(result);
      console.log(`Uploaded to Firebase: ${firebaseFileDownloadToken}`);

      const bucketName = bucket.name;
      const firebasePublicURL = generateFirebasePublicURL(
        bucketName,
        firebaseFileDownloadToken
      );
      // unlink compressed file
      await unlink(compressedFilePath);

      // Save file download token to MongoDB
      const { verticalId, courseId, unitId } = req.params;
      const mongoId = req.mongoId;
      const activityIndex = Number(req.body.activityIndex); // req.body comes from multer
      // console.log(activityIndex);

      const userDoc = await User.findById(mongoId);

      // ! update activity part here

      addRequiredUnitActivity(userDoc, verticalId, courseId, unitId);

      const unitActivity =
        userDoc.activity[`v${verticalId}`][`c${courseId}`][`u${unitId}`];

      unitActivity.activities[activityIndex] = firebaseFileDownloadToken;

      const updatedDoc = await User.findByIdAndUpdate(mongoId, userDoc, {
        new: true,
      });
      // console.log(updatedDoc.activity);

      res.status(200).json({
        statusText: statusText.FILE_UPLOAD_SUCCESS,
      });
    } catch (err) {
      console.log(err.message);
      res.status(500).json({
        statusText: statusText.FILE_UPLOAD_FAIL,
      });
    }
  }
);

module.exports = router;

/*
References:
Sending emails:
https://stackoverflow.com/questions/24695750/is-it-possible-to-to-send-bulk-pre-rendered-email-via-the-sendgrid-api
https://stackoverflow.com/questions/41329056/bulk-email-sending-usiing-node-js
*/
