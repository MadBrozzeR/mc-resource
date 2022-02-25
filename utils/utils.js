const https = require('https');
const http = require('http');
const fs = require('fs');
const request = require('mbr-request').requestDebugger;

const SETTINGS = require('../settings.js');

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

function readFile (file) {
  return new Promise(function (resolve, reject) {
    fs.readFile(file, function (error, data) {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    })
  });
}

function readJsonFile(file) {
  return readFile(file).then(function (data) {
    return JSON.parse(data.toString());
  });
}

function get (url, { onProgress } = {}, callback) {
  debug('Downloading: ' + url);

  const protocol = url[4] === 's' ? https : http;

  protocol.get(url, function (message) {
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
  }).on('error', function (error) {
    callback(error);
  });
}

function getRepeatable (url, {retries = 3, delay = 300, ...props} = {}, callback) {
  get(url, props, function (error, data) {
    if (error) {
      if (retries > 0) {
        setTimeout(function () {
          getRepeatable(url, { retries: retries - 1, delay, props }, callback);
        }, delay);
      } else {
        callback(error);
      }
    } else {
      callback(null, data);
    }
  });
}

function getPromissedJSON (url, params) {
  return new Promise(function (resolve, reject) {
    getRepeatable(url, params, function (error, data) {
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
    getRepeatable(url, params, function (error, data) {
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

    request({
      url,
      method: 'POST',
      headers,
      onResponse: function (data, message) {
        resolve({data, status: message.statusCode})
      },
      onError: reject,
      data,
      getRawRequest: function (data) {
        console.log(data.toString());
      },
      getRawResponse: function (data) {
        console.log(data.toString());
      }
    });
  });
}

function putPromissed (url, data, {token, contentType} = {}) {
  return new Promise(function (resolve, reject) {
    const headers = {
      'Content-Length': Buffer.byteLength(data)
    };
    token && (headers.Authorization = 'Bearer ' + token);
    contentType && (headers['Content-Type'] = contentType);

    request({
      url,
      method: 'PUT',
      headers,
      onResponse: function (data, message) {
        resolve({data, status: message.statusCode})
      },
      onError: reject,
      data,
      getRawRequest: function (data) {
        console.log('raw request', data.toString());
        fs.writeFile('./raw-request.log', data, function (error) {
          console.log(error);
        });
      },
      getRawResponse: function (data) {
        console.log('raw response', data.toString());
        fs.writeFile('./raw-response.log', data, function (error) {
          console.log(error);
        });
      }
    });
  });
}

function deletePromissed (url, token) {
  return new Promise(function (resolve, reject) {
    const headers = {};
    token && (headers.Authorization = 'Bearer ' + token);

    request({
      url,
      method: 'DELETE',
      headers,
      onResponse: function (data, message) {
        resolve({data, status: message.statusCode})
      },
      onError: reject
    });
  });
}

const BOUNDARY_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generateBoundary() {
  let length = 16;
  let boundary = 'mbr-mime-bound-';

  while (length--) {
    boundary += BOUNDARY_CHARS[~~(Math.random() * BOUNDARY_CHARS.length)];
  }

  return boundary;
}

function MimePart () {
  this.boundary = generateBoundary();
}
MimePart.prototype.part = function (headers, data) {
  let result = '--' + this.boundary + '\n';

  for (const key in headers) {
    result += key + ': ' + headers[key] + '\n';
  }
  result += '\n' + data + '\n';

  return result;
}
MimePart.prototype.binaryPart = function (headers, data) {
  const separator = '\n';
  const sepLen = Buffer.byteLength(separator);

  let length = Buffer.byteLength(this.boundary) + sepLen + 2;
  let result = [Buffer.from('--' + this.boundary + separator)];

  for (const key in headers) {
    const header = Buffer.from(key + ': ' + headers[key] + separator);
    result.push(header);
    length += header.length;
  }
  result.push(Buffer.from(separator), Buffer.from(data), Buffer.from(separator));
  length += Buffer.byteLength(data) + 2 * sepLen;

  return Buffer.concat(result, length);
}
MimePart.prototype.end = function () {
  return '--' + this.boundary + '--';
}

function checkResponse ({data, status}) {
  const response = data.length && JSON.parse(data.toString());

  return (status < 300) ? Promise.resolve(response) : Promise.reject(response);
}

module.exports = {
  readFile,
  readJsonFile,
  getPromissed,
  getPromissedJSON,
  postPromissed,
  putPromissed,
  deletePromissed,
  template,
  MimePart,
  checkResponse
};
