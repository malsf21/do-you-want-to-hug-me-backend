const https = require('https');
const read = require('fs').readFileSync;
const port = 3000;

const options = {
	key: read('cert/key.pem'),
	cert: read('cert/cert.pem'),
	passphrase: 'password' //TODO: Help me secure this plz
};

function execute(db, query) {
	try {
		db.run(query);
		db.close();
		return true;
	}

	catch (err) {
		return false;
	}
}

function handler(request, response){

	if (request.method == "POST"){
		var body;

		request.on('data', function (data) {
			body = data + [];
		});

		request.on('end', function() {
			// Load the db
			var sqlite3 = require('sqlite3').verbose();
			var db = new sqlite3.Database('db/database.db');

			data = body.split("&").map(function(pair) {
				return pair.split("=");
			}).reduce(function(result, item) {
				result[item[0]] = item[1];
				return result;
			}, {});

			var content;

			switch (data.function) {
				case "log-data":
					if (authenticated){
						[user, plush, date] = [data.user, data.plush, data.date];

						const query = `INSERT INTO plush_logs VALUES ("${user}", "${plush}", "${date}")`;
						const query_status = execute(db, query);

						if (query_status) {
							content = "success";
						}

						else {
							content = "query failure"
						}
					}
					else{
						content = "auth failure";
					}
					break;

				case "add-plush":
					if (authenticated){
						[user, plush, nickname] = [data.user, data.plush, data.nickname];

						const query = `INSERT INTO registered_plushes VALUES ("${user}", NULL, "${nickname}")`;
						const query_status = execute(db, query);

						// GET AUTOINCREMENT VALUE

						if (query_status) {
							content = "AUTOINCREMENT VALUE";
						}

						else {
							content = "query failure"
						}
					}
					else{
						content = "auth failure";
					}
					break;

				case "get-data":
					if (authenticated){
						user = data.user;
						const query = `SELECT * FROM plush_logs WHERE user = "${user}"`;
						const query_response = execute(db,query);

						if (query_response){
							content = query_response;
						}
						else{
							content = "query failure";
						}
					}
					else{
						content = "auth failure";
					}
					break;

				case "edit-plush":
					if (authenticated){
						[user, plush, nickname] = [data.user, data.plush, data.nickname];

						const query = `INSERT INTO registered_plushes VALUES ("${user}", "${plush}", "${nickname}")`;
						const query_status = execute(db, query);

						if (query_status) {
							content = "success";
						}

						else {
							content = "query failure"
						}
					}
					else{
						content = "auth failure";
					}
					break;

				case "user-reg":

					[user, real, pass, salt] = [data.user, data.real, "mypass", "thesalt"]

					const query = `INSERT INTO users VALUES ("${user}", "${real}", "${pass}", "${salt}");`
					const not_taken = execute(db, query);

					if (not_taken) {
						content = "true";
					}

					else {
						content = "false"
					}

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
