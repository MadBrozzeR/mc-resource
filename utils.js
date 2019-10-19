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

function get (url, callback) {
  debug('Downloading: ' + url);

  const method = url[4] === 's' ? https : http;

  method.get(url, function (message) {
    debug('Downloaded: ' + url);

    let data = [];
    let length = 0;

    message.on('data', function (chunk) {
      data.push(chunk);
      length += chunk.length;
    });
    message.on('end', function () {
      callback(null, Buffer.concat(data, length));
    });
    message.on('error', function (error) {
      callback(error);
    });
  });
}

function getPromissedJSON (url) {
  return new Promise(function (resolve, reject) {
    get(url, function (error, data) {
      try {
        error ? reject(error) : resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function getPromissed (url) {
  return new Promise(function (resolve, reject) {
    get(url, function (error, data) {
      try {
        error ? reject(error) : resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  });
}

module.exports = {
  getPromissed,
  getPromissedJSON,
  template
};
