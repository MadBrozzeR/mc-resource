const SETTINGS = require('./settings.js');
const {
  getPromissed,
  getPromissedJSON,
  postPromissed,
  putPromissed,
  deletePromissed,
  template,
  MimePart
} = require('./utils.js');

const URL = {
  MANIFEST: 'https://launchermeta.mojang.com/mc/game/version_manifest.json',
  ASSETS: 'http://resources.download.minecraft.net/${short}/${hash}',
  UUID: 'https://api.mojang.com/users/profiles/minecraft/${name}',
  UUID_TIME: 'https://api.mojang.com/users/profiles/minecraft/${name}?at=${timestamp}',
  NAMES: 'https://api.mojang.com/user/profiles/${uuid}/names',
  UUIDS: 'https://api.mojang.com/profiles/minecraft',
  PROFILE: 'https://sessionserver.mojang.com/session/minecraft/profile/${uuid}',
  SKIN: 'https://api.mojang.com/user/profile/${uuid}/skin',
  AUTH: 'https://authserver.mojang.com'
};

function getManifest () {
  return getPromissedJSON(URL.MANIFEST);
}

function getVersionByObject (version) {
  if (!version) {
    return Promise.reject(new Error('No version'));
  }

  const url = version.url;

  return getPromissedJSON(url);
}

const JSON_CT = {contentType: 'application/json'};
function checkResponse ({data, status}) {
  const response = data.length && JSON.parse(data.toString());

  return (status < 300) ? Promise.resolve(response) : Promise.reject(response);
}

function findVersion (version, manifest) {
  for (let index = 0 ; index < manifest.versions.length ; ++index) {
    if (manifest.versions[index].id === version) {
      return manifest.versions[index];
    }
  }

  return undefined;
}

function getVersion (version, manifest) {
  if (typeof version === 'string') {
    if (manifest) {
      return getVersionByObject(findVersion(version, manifest));
    } else {
      return getManifest().then(function (manifest) {
        return getVersionByObject(findVersion(version, manifest));
      }).catch(function (error) {
        return Promise.reject(error);
      });
    }
  } else {
    return getVersionByObject(version);
  }
}

function getAssets (version) {
  const url = version.assetIndex.url;

  return getPromissedJSON(url);
}

function getAsset (asset) {
  const data = {
    hash: asset.hash,
    short: asset.hash.substr(0, 2)
  };

  return getPromissed(template(URL.ASSETS, data));
}

function download (artifact, params) {
  const url = artifact && artifact.url;

  if (url) {
    return getPromissed(url, params);
  } else {
    return Promise.reject(new Error('"' + artifact + '" is not an artifact'));
  }
}

function setup (values) {
  for (const key in values) {
    if (key in SETTINGS) {
      SETTINGS[key] = values[key];
    }
  }
}

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

/*
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
      'Content-type': 'image/png'
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
*/
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

  return putPromissed(url, data, {
    token,
    contentType
  }).then(checkResponse);
}

function resetSkin ({uuid, token}) {
  const url = template(URL.SKIN, {uuid});

  return deletePromissed(url, token).then(checkResponse);
}

const Auth = {
  authenticate: function (username, password, {clientToken, requestUser} = {}) {
    const url = URL.AUTH + '/authenticate';
    const data = {
      agent: {
        name: 'Minecraft',
        version: 1
      },
      username,
      password,
      clientToken,
      requestUser
    };

    return postPromissed(url, JSON.stringify(data), JSON_CT).then(checkResponse);
  },

  refresh: function ({accessToken, clientToken, requestUser = false} = {}) {
    const url = URL.AUTH + '/refresh';
    const data = {
      accessToken,
      clientToken,
      requestUser
    };

    return postPromissed(url, JSON.stringify(data), JSON_CT).then(checkResponse);
  },

  validate: function (accessToken, {clientToken} = {}) {
    const url = URL.AUTH + '/validate';
    const data = {accessToken};
    clientToken && (data.clientToken = clientToken);

    return postPromissed(url, JSON.stringify(data), JSON_CT).then(checkResponse);
  },

  signout: function (username, password) {
    const url = URL.AUTH + '/signout';
    const data = {username, password};

    return postPromissed(url, JSON.stringify(data), JSON_CT).then(checkResponse);
  },

  invalidate: function ({accessToken, clientToken} = {}) {
    const url = URL.AUTH + '/invalidate';
    const data = {accessToken, clientToken};

    return postPromissed(url, JSON.stringify(data), JSON_CT).then(checkResponse);
  }
};

module.exports = {
  getManifest,
  getVersion,
  getAssets,
  getAsset,
  download,
  setup,
  getUUID,
  getNameHistory,
  getUUIDs,
  getProfileRaw,
  getProfile,
  changeSkin,
  uploadSkin,
  resetSkin,
  Auth
};
