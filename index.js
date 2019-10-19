const SETTINGS = require('./settings.js');
const { getPromissed, getPromissedJSON, template } = require('./utils.js');

const URL = {
  MANIFEST: 'https://launchermeta.mojang.com/mc/game/version_manifest.json',
  ASSETS: 'http://resources.download.minecraft.net/${short}/${hash}'
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

function download (artifact) {
  const url = artifact && artifact.url;

  if (url) {
    return getPromissed(url);
  } else {
    return Promise.reject(new Error('"' + artifact + '" is not an artifact'));
  }
}

function setup (values) {
  for (key in values) {
    if (key in SETTINGS) {
      SETTINGS[key] = values[key];
    }
  }
}

module.exports = {
  getManifest,
  getVersion,
  getAssets,
  getAsset,
  download,
  setup
};
