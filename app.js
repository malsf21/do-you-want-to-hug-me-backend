const https = require('https');
const read = require('fs').readFileSync;
const port = 3000;

const options = {
	key: read('cert/key.pem'),
	cert: read('cert/cert.pem'),
	passphrase: 'password' //TODO: Help me secure this plz
};

function handler(request, response){

	if (request.method == "POST"){
		var body;

		request.on('data', function (data) {
			body = data + [];
		});

		request.on('end', function() {
			data = body.split("&").map(function(pair) {
				return pair.split("=");
			});

			var content;

			switch (data[0][0]) {
				case "log-data":
					//Do...
					content = "";
					break;

				case "add-plush":
					//Do...
					content = "";
					break;

				case "get-data":
					//Do...
					content = "";
					break;

				case "edit-plush":
					//Do...
					content = "";
					break;


				case "user-in":
					//Do...
					break;

				case "user-edit":
					//Do...
					break;

				default:
					//Do...
					break;
			}

			response.writeHead(200, {'Content-Type': 'text/html'});
			response.end(content);
		});
	}

	else {
		response.writeHead(200, {'Content-Type': 'text/html'});

		response.end("This was a get request");
	}
}

const server = https.createServer(options, handler);

server.listen(port, function(err){  
	if (err) {
		return console.log('something bad happened', err);
	}

	console.log(`server is listening at https://localhost:${port}`);
});