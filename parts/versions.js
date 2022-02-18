const { URL } = require('../constants.js');
const {
  readJsonFile,
  getPromissed,
  getPromissedJSON,
  // postPromissed,
  // putPromissed,
  // deletePromissed,
  template,
  // MimePart
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

Asset.prototype.get = function () {
  const data = {
    hash: this.info.hash,
    short: this.info.hash.substr(0, 2)
  };

  return getPromissed(template(URL.ASSETS, data));
}

function Version (info) {
  this.info = info;
  this.data = new Particle();
  this.assets = new Particle();
}

Version.prototype.fetch = function () {
  if (!this.data.isLoading()) {
    return this.data.promised(getPromissedJSON(this.info.url)).then(getParticleData);
  }

  return Promise.reject(new Error('Request is already been sent'))
}

Version.prototype.get = function () {
  if (this.data.isSuccess()) {
    return Promise.resolve(getParticleData(this.data));
  }

  return this.fetch();
}

Version.prototype.getFromFile = function (file) {
  if (!this.data.isLoading()) {
    return this.data.promised(readJsonFile(file)).then(getParticleData);
  }

  return Promise.reject(new Error('File is already being read'));
}

Version.prototype.getAssets = function () {
  const version = this;

  return this.get().then(function (data) {
    if (version.assets.isSuccess()) {
      return Promise.resolve(getParticleData(version.assets));
    }

    if (version.assets.isLoading()) {
      return Promise.reject(new Error('Request is already been sent'));
    }

    return version.assets.promised(getPromissedJSON(data.assetIndex.url)).then(getParticleData);
  });
}

Version.prototype.getAsset = function (file) {
  const version = this;

  return this.getAssets().then(function (assets) {
    return assets && assets.objects[file] ? new Asset(assets.objects[file]) : null
  });
}

Version.prototype.getClient = function (params) {
  return this.get().then(function (data) {
    return data.downloads.client ? download(data.downloads.client, params) : null;
  });
}

Version.prototype.getServer = function (params) {
  return this.get().then(function (data) {
    return data.downloads.server ? download(data.downloads.server, params) : null;
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

Versions.prototype.fetch = function () {
  if(!this.data.isLoading()) {
    return this.data.promised(getPromissedJSON(URL.MANIFEST))
  }

  return Promise.reject(new Error('Request is already been sent'));
}

Versions.prototype.get = function (id) {
  const versions = this;

  return new Promise(function (resolve, reject) {
    if (versions.data.isSuccess()) {
      if (id) {
        resolve(versions.find(id));
      } else {
        resolve(versions.data.data);
      }
    } else {
      versions.fetch()
        .then(function (data) {
          if (id) {
            resolve(versions.find(id));
          } else {
            resolve(data.data)
          }
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

Versions.prototype.getVersion = function (id) {
  return this.get(id).then(function (version) {return version.get()})
}

module.exports = Versions;
