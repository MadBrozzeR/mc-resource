const { URL } = require('../constants.js');
const {
  readJsonFile,
  getPromissed,
  getPromissedJSON,
  template,
} = require('../utils/utils.js');
const { Particle } = require('../utils/particle.js');

function download (artifact, params) {
  const url = artifact && artifact.url;

  if (url) {
    return getPromissed(url, params);
  } else {
    return Promise.reject(new Error('"' + artifact + '" is not an artifact'));
  }
}

function getParticleData(particle) {
  return particle.data;
}

function Asset (info) {
  this.info = info;
}

Asset.prototype.get = function (fetchParams) {
  const data = {
    hash: this.info.hash,
    short: this.info.hash.substr(0, 2)
  };

  return getPromissed(template(URL.ASSETS, data), fetchParams);
}

function Version (info) {
  this.info = info;
  this.data = new Particle();
  this.assets = new Particle();
}

Version.prototype.fetch = function (fetchParams) {
  if (!this.data.isLoading()) {
    return this.data.promised(getPromissedJSON(this.info.url, fetchParams)).then(getParticleData);
  }

  return Promise.reject(new Error('Request is already been sent'))
}

Version.prototype.get = function (fetchParams) {
  if (this.data.isSuccess()) {
    return Promise.resolve(getParticleData(this.data));
  }

  return this.fetch(fetchParams);
}

Version.prototype.getFromFile = function (file) {
  if (!this.data.isLoading()) {
    return this.data.promised(readJsonFile(file)).then(getParticleData);
  }

  return Promise.reject(new Error('File is already being read'));
}

Version.prototype.getAssets = function (fetchParams) {
  const version = this;

  return this.get(fetchParams).then(function (data) {
    if (version.assets.isSuccess()) {
      return Promise.resolve(getParticleData(version.assets));
    }

    if (version.assets.isLoading()) {
      return Promise.reject(new Error('Request is already been sent'));
    }

    return version.assets.promised(getPromissedJSON(data.assetIndex.url, fetchParams)).then(getParticleData);
  });
}

Version.prototype.getAsset = function (file, fetchParams) {
  const version = this;

  return this.getAssets(fetchParams).then(function (assets) {
    return assets && assets.objects[file] ? new Asset(assets.objects[file]) : null
  });
}

Version.prototype.getClient = function (fetchParams) {
  return this.get(fetchParams).then(function (data) {
    return data.downloads.client ? download(data.downloads.client, fetchParams) : null;
  });
}

Version.prototype.getServer = function (fetchParams) {
  return this.get(fetchParams).then(function (data) {
    return data.downloads.server ? download(data.downloads.server, fetchParams) : null;
  });
}

function Versions () {
  this.data = new Particle();
}

Versions.prototype.find = function (id) {
  if (this.data.isSuccess()) {
    const manifest = this.data.data;

    for (let index = 0 ; index < manifest.versions.length ; ++index) {
      if (manifest.versions[index].id === id) {
        return new Version(manifest.versions[index]);
      }
    }
  }

  return null;
}

Versions.prototype.fetch = function (fetchParams) {
  if(!this.data.isLoading()) {
    return this.data.promised(getPromissedJSON(URL.MANIFEST, fetchParams));
  }

  return Promise.reject(new Error('Request is already been sent'));
}

Versions.prototype.getList = function (fetchParams) {
  const versions = this;

  return new Promise(function (resolve, reject) {
    if (versions.data.isSuccess()) {
      resolve(getParticleData(versions.data));
    } else {
      versions.fetch(fetchParams)
        .then(function (data) {
          resolve(getParticleData(data));
        })
        .catch(reject)
    }
  });
}

Versions.prototype.get = function (id, fetchParams) {
  const versions = this;

  return new Promise(function (resolve, reject) {
    if (versions.data.isSuccess()) {
      resolve(versions.find(id));
    } else {
      versions.fetch(fetchParams)
        .then(function () {
          resolve(versions.find(id));
        })
        .catch(reject)
    }
  });
}

Versions.prototype.getFromFile = function (file) {
  return new Promise(function (resolve, reject) {
    const version = new Version({});
    version.getFromFile(file).then(function () {
      resolve(version);
    }).catch(reject);
  });
}

Versions.prototype.getVersion = function (id, fetchParams) {
  return this.get(id, fetchParams).then(function (version) {return version.get(fetchParams)})
}

module.exports = Versions;
