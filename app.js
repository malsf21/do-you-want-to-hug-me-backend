const https = require('https');
const read = require('fs').readFileSync;
const port = 3000;

const bcrypt = require('bcryptjs');

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

function authenticate(db, user, pass, callback) {
	db.all(`SELECT * FROM users WHERE username="${user}";`, function(err, rows){
		const row = rows[0]
		callback(bcrypt.compareSync(pass + row.salt, row.password));
	});

	db.close();
}

function respond(response, content) {
	response.writeHead(200, {'Content-Type': 'text/html'});
	response.end(content + []);
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
							respond(response, "success");
						}

						else {
							respond(response, "query failure");
						}
					}
					else{
						respond(response, "auth failure");
					}
					break;

				case "add-plush":
					if (authenticated){
						[user, plush, nickname] = [data.user, data.plush, data.nickname];

						const query = `INSERT INTO registered_plushes VALUES ("${user}", NULL, "${nickname}")`;
						const query_status = execute(db, query);

						// GET AUTOINCREMENT VALUE

						if (query_status) {
							respond(response, "AUTOINCREMENT VALUE");
						}

						else {
							respond(response, "query failure");
						}
					}
					else{
						respond(response, "auth failure");
					}
					break;

				case "get-data":
					if (authenticated){
						user = data.user;
						const query = `SELECT * FROM plush_logs WHERE user = "${user}"`;
						const query_response = execute(db,query);

						if (query_response){
							respond(response, query_response);
						}
						else{
							respond(response, "query failure");
						}
					}
					else{
						respond(response, "auth failure");
					}
					break;

				case "edit-plush":
					if (authenticated){
						[user, plush, nickname] = [data.user, data.plush, data.nickname];

						const query = `INSERT INTO registered_plushes VALUES ("${user}", "${plush}", "${nickname}")`;
						const query_status = execute(db, query);

						if (query_status) {
							respond(response, "success");
						}

						else {
							respond(response, "query failure");
						}
					}
					else{
						respond(response, "auth failure");
					}
					break;

				case "user-reg":

					const pass = data.pass;
					const salt = bcrypt.genSaltSync(10);

					[user, real, hash] = [data.user, data.real, bcrypt.hashSync(pass+salt, 10)];

					const query = `INSERT INTO users VALUES ("${user}", "${real}", "${hash}", "${salt}");`;
					const not_taken = execute(db, query);

					if (not_taken) {
						respond(response, "true");
					}

					else {
						respond(response, "false");
					}

					break;

				case "user-edit":
					authenticate(data.user, data.pass, function(){
						const pass = data.pass;
						const salt = bcrypt.genSaltSync(10);

						[user, real, hash] = [data.user, data.real, bcrypt.hashSync(pass+salt, 10)];

						const query = `UPDATE INTO users SET realname="${real}", password="${pass}", salt="${salt}" WHERE username="${user}";`;
						const sucess = execute(db, query);

						if (sucess) {
							respond(response, "true");
						}

						else {
							respond(response, "false");
						}
					});

					break;

				case "user-auth":
					authenticate(db, data.user, data.pass, function(state) {
						respond(response, state);
					});
					break;

				default:
					//Do...
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
