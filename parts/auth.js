const { URL, JSON_CT } = require('../constants.js');
const {
  postPromissed,
} = require('../utils/utils.js');

module.exports = {
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
