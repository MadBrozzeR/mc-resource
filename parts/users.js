const { URL } = require('../constants.js');
const {
  getPromissedJSON,
  template,
  postPromissed,
  putPromissed,
  deletePromissed,
  MimePart
} = require('../utils/utils.js')

function getUUID (name, timestamp) {
  const url = (timestamp === undefined)
    ? template(URL.UUID, {name})
    : template(URL.UUID_TIME, {name, timestamp});

  return getPromissedJSON(url);
}

function getNameHistory (uuid) {
  const url = template(URL.NAMES, {uuid});

  return getPromissedJSON(url);
}

function getUUIDs (names) {
  return postPromissed(URL.UUIDS, JSON.stringify(names)).then(function ({data}) {
    return JSON.parse(data);
  });
}

function retrieveProperties (profile) {
  let property;
  let value;
  const result = {};

  for (let index = 0 ; index < profile.properties.length ; ++index) {
    property = profile.properties[index];
    value = JSON.parse(Buffer.from(profile.properties[index].value, 'base64').toString());

    if (property.name in result) {
      result[property.name].push(value);
    } else {
      result[property.name] = [value];
    }
  }

  return result;
}

function getProfileRaw (uuid) {
  const url = template(URL.PROFILE, {uuid});

  return getPromissedJSON(url);
}

function getProfile (uuid) {
  return getProfileRaw(uuid).then(function (profile) {
    profile.properties = retrieveProperties(profile);
    return profile;
  });
}

function changeSkin (skin, {uuid, token, slim = false}) {
  const url = template(URL.SKIN, {uuid});
  const model = slim ? 'slim' : '';
  const data = `model=${model}&url=${encodeURIComponent(skin)}`;
  const contentType = 'application/x-www-form-urlencoded';

  return postPromissed(url, data, {
    token,
    contentType
  }).then(checkResponse);
}

function uploadSkin (imageData, {uuid, token, slim, name}) {
  const url = template(URL.SKIN, {uuid});
  const model = slim ? 'slim' : '';
  const mimePart = new MimePart();
  const contentType = `multipart/form-data; boundary=${mimePart.boundary}`;
  const mimeParts = [
    mimePart.binaryPart({
      'Content-Disposition': 'form-data; name="model"'
    }, model),
    mimePart.binaryPart({
      'Content-Disposition': `form-data; name="file"; filename="${name}"`,
      'Content-Type': 'image/png'
    }, imageData),
    Buffer.from(mimePart.end())
  ];
  const length = mimeParts[0].length + mimeParts[1].length + mimeParts[2].length;
  const data = Buffer.concat(mimeParts, length);

  return putPromissed(url, data, {
    token,
    contentType
  }).then(checkResponse);
}
/*
function uploadSkin (imageData, {uuid, token, slim, name}) {
  const url = template(URL.SKIN, {uuid});
  const model = slim ? 'slim' : '';
  const mimePart = new MimePart();
  const contentType = `multipart/form-data; boundary=${mimePart.boundary}`;
  const data = mimePart.part({
    'Content-Disposition': 'form-data; name="model"'
  }, slim ? 'slim' : '') + mimePart.part({
    'Content-Disposition': `form-data; name="file"; filename="${name}"`,
    'Content-Type': 'image/png',
    'Content-Transfer-Encoding': 'base64'
  }, imageData.toString('base64')) + mimePart.end();

  fs.writeFileSync('./image.png', imageData);

  return putPromissed(url, data, {
    token,
    contentType
  }).then(checkResponse);
}
*/

function resetSkin ({uuid, token}) {
  const url = template(URL.SKIN, {uuid});

  return deletePromissed(url, token).then(checkResponse);
}

module.exports = {
  getUUID,
  getUUIDs,
  getNameHistory,
  retrieveProperties,
  getProfile,
  getProfileRaw,
  changeSkin,
  uploadSkin,
  resetSkin
}
