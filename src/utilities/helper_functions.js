const fs = require("fs");
const { vars } = require("../utilities/constants");

const encodeCertificateId = (userMongId, verticalId, courseId, unitId) => {
  return userMongId + "-" + verticalId + "-" + courseId + "-" + unitId;
};

const decodeCertificateId = (certId) => {
  const [userMongId, verticalId, courseId, unitId] = certId.split("-");
  return {
    userMongId: userMongId,
    verticalId: verticalId,
    courseId: courseId,
    unitId: unitId,
  };
};

const createDir = async (path) => {
  // console.log(path);

  fs.mkdir(path, { recursive: true }, (err) => {
    if (err) {
      console.log("Dir creation fail:", err.message);
    } else {
      console.log("Dir created successfully:", path);
    }
  });
};

const isFileSizeValid = (sizeInBytes) => {
  return sizeInBytes <= vars.imageFile.IMAGE_SIZE_LIMIT_IN_BYTES;
};

const isFileMimeTypeValid = (mimeType) => {
  return vars.imageFile.IMAGE_MIME_TYPES_WHITE_LIST.includes(mimeType);
};

const generateFirebasePublicURL = (bucketName, fileDownloadToken) => {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${fileDownloadToken}?alt=media&token=${fileDownloadToken}`;
};

const getUserActivityDefaultObj = () => {
  return {
    video: { watchTimeInPercent: 0 },
    activities: [],
    quiz: {
      scoreInPercent: -1,
      passingDate: "",
    },
  };
};

const isRequiredUnitActivityPresent = (
  userDoc,
  verticalId,
  courseId,
  unitId
) => {
  return (
    userDoc &&
    userDoc.activity &&
    userDoc.activity[`v${verticalId}`] &&
    userDoc.activity[`v${verticalId}`][`c${courseId}`] &&
    userDoc.activity[`v${verticalId}`][`c${courseId}`][`u${unitId}`]
  );
};

const addRequiredUnitActivity = (userDoc, verticalId, courseId, unitId) => {
  /* adds the required unit activity default field (and any required intermediate fields) to the provided userdoc
  objects are passed by reference in JS
  
  If any intermediate field is present, then it remains untouched
  for example: if userDoc.activity.v1.c1.u1 is already defined then it remains untouched
  */

  if (!userDoc) {
    return;
  }

  //! use this method only to check a key in an object
  if (userDoc.activity === undefined) {
    userDoc["activity"] = {};
  }

  const verticalKey = `v${verticalId}`;
  if (userDoc.activity[verticalKey] === undefined) {
    userDoc.activity[verticalKey] = {};
  }

  const courseKey = `c${courseId}`;
  if (userDoc.activity[verticalKey][courseKey] === undefined) {
    userDoc.activity[verticalKey][courseKey] = {};
  }

  const unitKey = `u${unitId}`;
  if (userDoc.activity[verticalKey][courseKey][unitKey] === undefined) {
    userDoc.activity[verticalKey][courseKey][unitKey] =
      getUserActivityDefaultObj();
  }
};

module.exports = {
  encodeCertificateId,
  decodeCertificateId,
  createDir,
  isFileSizeValid,
  isFileMimeTypeValid,

  generateFirebasePublicURL,

  getUserActivityDefaultObj,
  isRequiredUnitActivityPresent,
  addRequiredUnitActivity,
};
