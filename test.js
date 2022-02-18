const fs = require('fs');
const MCRes = require('./index.js');

function handleError (error) {
  console.log(error);
}

MCRes.setup({
  debug: function (data) {console.log(data);}
});

/*
MCRes.getManifest()
  .then(function (manifest) {
    MCRes.getVersion(manifest.versions[0])
      .then(function (version) {
        MCRes.getAssets(version)
          .then(function (assets) {
            MCRes.getAsset(assets.objects['realms/lang/da_dk.json'])
              .then(data => console.log(data))
              .catch(handleError);
            console.log(assets);
          }).catch(handleError);
        MCRes.download(version.downloads.client)
          .then(function (data) {
            // console.log(data);
          }).catch(handleError);
      }).catch(handleError);
  }).catch(handleError);
  */

const UUID = '300626b332b24235b2daba5fc07b4335';
const UIDY = '4aa7db6692c746149f3592d0bd4092fa';
const AT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJlZGMyNGZlNGNhZDg3OWU2ZDNiOTdhZDcxOGM1ZmU0YiIsIm5iZiI6MTU3MzA3MzI2MywieWdndCI6ImVjNjdjMDI2ZGM3MjQ0YThiODQ3MjFjMGRlNjEwMTYwIiwic3ByIjoiNGFhN2RiNjY5MmM3NDYxNDlmMzU5MmQwYmQ0MDkyZmEiLCJyb2xlcyI6W10sImlzcyI6ImludGVybmFsLWF1dGhlbnRpY2F0aW9uIiwiZXhwIjoxNTczMjQ2MDYzLCJpYXQiOjE1NzMwNzMyNjN9.4m1K3iE0yw8bu_WMJSUEAuhVqT6p8MtVOtjAz9O4en8';
const CT = 'aaa111';

/*
MCRes.Auth.authenticate('minecraft2.s@madbr.ru', 'Nikita.2008', {clientToken: CT, requestUser: true})
  .then(function (response) {
    console.log('resolved', JSON.stringify(response, null, 2));
  })
  .catch(function (error) {
    console.log('rejected', error);
  });
*/

/*
MCRes.Auth.validate(AT, {clientToken: CT})
  .then(function (response) {
    console.log('resolved', JSON.stringify(response, null, 2));
  })
  .catch(function (error) {
    console.log('rejected', error);
  });
*/

/*
MCRes.Auth.invalidate({accessToken: AT, clientToken: UUID}).then(function (response) {
    console.log('resolved', JSON.stringify(response, null, 2));
  })
  .catch(function (error) {
    console.log('rejected', error);
  });
*/

/*
MCRes.Auth.refresh({accessToken: AT, clientToken: CT})
  .then(function (response) {
    console.log('resolved', JSON.stringify(response, null, 2));
  })
  .catch(function (error) {
    console.log('rejected', error);
  });
*/

/*
MCRes.getProfile(UIDY)
  .then(function (response) {
    console.log('resolved', JSON.stringify(response, null, 2));
  })
  .catch(function (error) {
    console.log('rejected', error);
  });
*/

/*
MCRes.resetSkin({uuid: UIDY, token: AT})
  .then(function (response) {
    console.log('resolved', JSON.stringify(response, null, 2));
  })
  .catch(function (error) {
    console.log('rejected', error);
  });
*/

/*
MCRes.Auth.signout('minecraft2.s@madbr.ru', 'Nikita.2008')
  .then(function (response) {
    console.log('resolved', JSON.stringify(response, null, 2));
  })
  .catch(function (error) {
    console.log('rejected', error);
  });
*/

MCRes.uploadSkin(fs.readFileSync('/home/madbrozzer/Downloads/3px_reference.png'), {uuid: UIDY, token: AT, slim: true, name: 'my_skin.png'})
  .then(function (response) {
    console.log('resolved', JSON.stringify(response, null, 2));
  })
  .catch(function (error) {
    console.log('rejected', error);
  });
