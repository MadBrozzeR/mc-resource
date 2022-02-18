const http = require('http');

const BODY = `
<html>
<body>
<form method="POST" action="action">
  <input name="asd" />
  <input type="file" name="file"/>
  <button onclick="send(event)">Send</button>
</form>
<script>
function send(event) {
  event.preventDefault();
  var form = document.forms[0];
  var formData = new FormData(form);
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'action');
  xhr.send(formData);
  xhr.onstatuschange = function () {
    console.log(arguments);
  }
}
</script>
</body>
</html>
`;

http.createServer(function (request, response) {
  switch (request.url) {
    case '/':
      response.end(BODY);
      break;
    case '/action':
      const chunks = [];
      request.on('data', function(chunk) {
        chunks.push(chunk);
      }).on('end', function () {
        const data = Buffer.concat(chunks);
        console.log(data.toString());
        response.end('OK');
      });
  }
}).listen(8080);
