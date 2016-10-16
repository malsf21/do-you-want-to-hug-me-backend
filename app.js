const https = require('https');
const read = require('fs').readFileSync;
const port = 3000;

const bcrypt = require('bcryptjs');

const options = {
	cert: read("/etc/letsencrypt/live/sarick.tech/cert.pem"),
	key: read("/etc/letsencrypt/live/sarick.tech/privkey.pem"),
	chain: read("/etc/letsencrypt/live/sarick.tech/chain.pem"),
	fullchain: read("/etc/letsencrypt/live/sarick.tech/fullchain.pem")

	// key: read('cert/key.pem'),
	// cert: read('cert/cert.pem'),
	// passphrase: 'pass'
};

trip = function() {console.log("PING")}

function execute(query) {
	try {
		// Load the db
		var sqlite3 = require('sqlite3').verbose();
		var db = new sqlite3.Database('db/database.db');
		db.run(query);
		db.close();
		return true;
	}

	catch (err) {
		return false;
	}
}

function authenticate(user, pass, callback) {

	var sqlite3 = require('sqlite3').verbose();
	var db = new sqlite3.Database('db/database.db');

	db.all(`SELECT * FROM users WHERE username="${user}";`, function(err, rows){
		const row = rows[0]
		callback(bcrypt.compareSync(pass + row.salt, row.password));
	});

	db.close();
}

function respond(response, content) {
	console.log("<= " + content);

	response.writeHead(200, {
		'Content-Type': 'application/javascript',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Credentials': 'true'
	});
	response.end(content + []);
}

function handler(request, response){

	if (request.method == "POST"){
		var body;

		request.on('data', function (data) {
			body = data + [];
		});

		request.on('end', function() {
			console.log(request.method + " => " + body);

			// Either it's JSON
			try {
				data = JSON.parse(body)
				data = Object.keys(data).reduce(function(clean, key) {
					clean[key] = data[key].replace(/[`'"]+/g, '');
					return clean;
				}, {});
			}

			// the whole key=val&key2=val2&... thing
			catch (err){
				try {
					
					data = body.split("&").map(function(pair) {
						return pair.split("=");
					}).reduce(function(result, item) {
						result[item[0]] = item[1]//.replace(/[`'"]+/g, '');
						return result;
					}, {});
				}

				catch (err){
					respond(response, "improper query format");
					return 0
				}
			}

			var content;
			// console.log(data);

			switch (data.function) {
				case "log-data":
					authenticate(data.user, data.pass, function() {
						[user, plush, date] = [data.user, data.plush, data.date];

						const query = `INSERT INTO plush_logs VALUES ("${user}", "${plush}", "${date}");`;
						const query_status = execute(query);

						if (query_status) {
							respond(response, "success");
						}

						else {
							respond(response, "query failure");
						}
					});
					break;

				case "add-plush":
					authenticate(data.user, data.pass, function() {
						[user, nickname] = [data.user, data.nickname];

						const query = `INSERT INTO registered_plushes VALUES ("${user}", "${nickname}", NULL)`;
						const query_status = execute(query);

						// GET AUTOINCREMENT VALUE

						if (query_status) {
							respond(response, "AUTOINCREMENT VALUE");
						}

						else {
							respond(response, "query failure");
						}
					});
					break;

				case "get-data":
					authenticate(data.user, data.pass, function() {
						user = data.user;

						const query = `
						SELECT plush_logs.*, registered_plushes.plush_name FROM plush_logs 
						INNER JOIN registered_plushes
							ON plush_logs.plush_id=registered_plushes.plush_id
							AND plush_logs.user = registered_plushes.user
						WHERE plush_logs.user = "${user}";`;

						var sqlite3 = require('sqlite3').verbose();
						var db = new sqlite3.Database('db/database.db');

						db.all(query, function(err, rows){
							respond(response, JSON.stringify(rows));
						});

						db.close();
					});
					break;

				case "edit-plush":
					authenticate(data.user, data.pass, function() {
						[user, plush, nickname] = [data.user, data.plush, data.nickname];

						const query = `INSERT INTO registered_plushes VALUES ("${user}", ${plush}, "${nickname}");`;
						const query_status = execute(query);

						if (query_status) {
							respond(response, "success");
						}

						else {
							respond(response, "query failure");
						}
					});
					break;

				case "user-reg":

					const pass = data.pass;
					const salt = bcrypt.genSaltSync(10);

					[user, real, hash] = [data.user, data.real, bcrypt.hashSync(pass+salt, 10)];

					const query = `INSERT INTO users VALUES ("${user}", "${real}", "${hash}", "${salt}");`;
					const not_taken = execute(query);

					if (not_taken) {
						respond(response, "true");
					}

					else {
						respond(response, "false");
					}

					break;

				case "user-edit":
					authenticate(data.user, data.pass, function(){
						const pass = data.new_pass;
						const salt = bcrypt.genSaltSync(10);

						[user, real, hash] = [data.user, data.real, bcrypt.hashSync(pass+salt, 10)];

						const query = `UPDATE users SET realname="${real}", password="${hash}", salt="${salt}" WHERE username="${user}";`;
						const sucess = execute(query);

						if (sucess) {
							respond(response, "true");
						}

						else {
							respond(response, "false");
						}
					});

					break;

				case "user-auth":
					authenticate(data.user, data.pass, function(state) {
						respond(response, state);
					});
					break;
			}
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
