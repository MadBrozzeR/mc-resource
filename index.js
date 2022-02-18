const SETTINGS = require('./settings.js');
const Auth = require('./parts/auth.js');
const Users = require('./parts/users.js');
const Versions = require('./parts/versions.js')

function setup (values) {
  for (const key in values) {
    if (key in SETTINGS) {
      SETTINGS[key] = values[key];
    }
  }
}

module.exports = {
  setup,
  Versions,
  Users,
  Auth
};
