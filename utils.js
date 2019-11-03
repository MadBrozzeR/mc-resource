const https = require('https');
const http = require('http');

const SETTINGS = require('./settings.js');

const REPLACE_KEY = /\$\{(\w+)\}/g;

function debug (data) {
  if (SETTINGS.debug instanceof Function) {
    SETTINGS.debug(data);
  }
}

function template (template, substitutions) {
  return template.replace(REPLACE_KEY, function (_, key) {
    return substitutions[key] || '';
  });
}

function get (url, { onProgress } = {}, callback) {
  debug('Downloading: ' + url);

  const method = url[4] === 's' ? https : http;

  method.get(url, function (message) {
    debug('Downloaded: ' + url);

    let data = [];
    let length = 0;

    message.on('data', function (chunk) {
      data.push(chunk);
      length += chunk.length;
      onProgress && onProgress(length);
    });
    message.on('end', function () {
      callback(null, Buffer.concat(data, length), message.statusCode);
    });
    message.on('error', function (error) {
      callback(error);
    });
  });
}

function request (url, method, headers, callback) {
  const method = url[4] === 's' ? https : http;

  return method.request(url, {
    method,
    headers
  }, function (response) {
    const chunks = [];
    let length = 0;

    response.on('data', function (chunk) {
      chunks.push(chunk);
      length += chunk.length;
    }).on('end', function () {
      callback(null, Buffer.concat(chunks, length), response.statusCode);
    }).on('error', function (error) {
      callback(error);
    });
  }).on('error', function (error) {
    callback(error);
  });
}

function getPromissedJSON (url) {
  return new Promise(function (resolve, reject) {
    get(url, undefined, function (error, data) {
      try {
        error ? reject(error) : resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function getPromissed (url, params) {
  return new Promise(function (resolve, reject) {
    get(url, params, function (error, data) {
      error ? reject(error) : resolve(data);
    });
  });
}

function postPromissed (url, data, {token, contentType} = {}) {
  return new Promise(function (resolve, reject) {
    const headers = {
      'Content-Length': Buffer.byteLength(data)
    };
    token && (headers.Authorization = 'Bearer ' + token);
    contentType && (headers['Content-Type'] = contentType);

    request(url, 'POST', headers, function (error, data, status) {
      error ? reject(error) : resolve(data, status);
    }).end(data);
  });
}

function putPromissed (url, data, {token, contentType} = {}) {
  return new Promise(function (resolve, reject) {
    const headers = {
      'Content-Length': Buffer.byteLength(data)
    };
    token && (headers.Authorization = 'Bearer ' + token);
    contentType && (headers['Content-Type'] = contentType);

    request(url, 'PUT', headers, function (error, data, status) {
      error ? reject(error) : resolve(data, status);
    }).end(data);
  });
}

function deletePromissed (url, token) {
  return new Promise(function (resolve, reject) {
    const headers = {};
    token && (headers.Authorization = 'Bearer ' + token);

    request(url, 'DELETE', headers, function (error, data, status) {
      error ? reject(error) : resolve(data, status);
    }).end();
  });
}

const BOUNDARY_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generateBoundary() {
  let length = 10;
  let boundary = '--boundary-';

  while (length--) {
    boundary += BOUNDARY_CHARS[~~(Math.random() * BOUNDARY_CHARS.length)];
  }

  return boundary;
}

function MimePart () {
  this.boundary = generateBoundary();
}
MimePart.prototype.part = function (headers, data) {
  let result = this.boundary + '\n';

  for (let key in headers) {
    result += key + ': ' + headers[key]; + '\n'
  }
  result += '\n' + data + '\n';

  return result;
}
MimePart.prototype.end = function () {
  return this.boundary + '--'
}

module.exports = {
  getPromissed,
  getPromissedJSON,
  postPromissed,
  putPromissed,
  deletePromissed,
  template,
  MimePart
};
