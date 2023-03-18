const jwt = require("jsonwebtoken");

// My models
const User = require("./databases/mongodb/models/User");

const statusText = require("./utilities/status_text.js");
const { vars } = require("./utilities/constants");

////////////////////////////////////////////////////////////////////////////////////////

const fetchPerson = (req, res, next) => {
  const token = req.header("auth-token");
  console.log(token);
  // * if token is verified then the mongoId contained in the token always belongs to some user doc

  if (!token) {
    return res
      .status(401)
      .send({ statusText: statusText.TOKEN_NOT_FOUND, isLoggedIn: false });
  }

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.mongoId = data.person.mongoId;
    req.role = data.person.role;

    // console.log(req.role);
    next();
  } catch (err) {
    console.log(err.message);
    res
      .status(401)
      .send({ statusText: statusText.INVALID_TOKEN, isLoggedIn: false });
  }
};

const isUser = (req, res, next) => {
  // console.log(req.role);
  if (req.role !== "user") {
    return res
      .status(401)
      .send({ statusText: statusText.INVALID_TOKEN, isUser: false });
  }
  next();
};

const isAdmin = (req, res, next) => {
  if (req.role !== "admin") {
    return res
      .status(401)
      .send({ statusText: statusText.INVALID_TOKEN, isAdmin: false });
  }

  next();
};

const arePrereqSatisfied = async (req, res, next) => {
  const userDoc = await User.findById(req.mongoId);
  // console.log(userDoc);

  if (!userDoc.isPassReset || !userDoc.isRegistered) {
    return res
      .status(403)
      .json({ statusText: statusText.PREREQ_NOT_SATISFIED, userDoc: userDoc });
  }

  req.userDoc = userDoc;

  next();
};

// ! check whether the user is eligible to take quiz, this is imp in cases when user directly copy pastes the url of the quiz page and tries to submit it
const isEligibleToTakeQuiz = async (req, res, next) => {
  const { verticalId, courseId, unitId } = req.params;
  const userDoc = await User.findById(req.mongoId);

  // ! why are we not checking that the verticalid, courseid, unitid is valid
  const verticalKey = `v${verticalId}`;
  const courseKey = `c${courseId}`;
  const unitKey = `u${unitId}`;

  if (
    userDoc.activity === undefined ||
    userDoc.activity[verticalKey] === undefined ||
    userDoc.activity[verticalKey][courseKey] === undefined ||
    userDoc.activity[verticalKey][courseKey][unitKey] === undefined ||
    userDoc.activity[verticalKey][courseKey][unitKey].video.watchTimeInPercent <
      vars.activity.MIN_WATCH_TIME_IN_PERCENT
  ) {
    return res.status(403).json({
      statusText: statusText.NOT_ELIGIBLE_TO_TAKE_QUIZ,
      isEligibleToTakeQuiz: false,
    });
  }

  next();
};

module.exports = {
  fetchPerson,
  isUser,
  isAdmin,
  arePrereqSatisfied,
  isEligibleToTakeQuiz,
};
