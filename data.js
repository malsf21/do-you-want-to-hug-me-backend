var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('db/test.db');

db.serialize(function() {
	db.each("SELECT email FROM users", function(err, row) {
		console.log(row.email);
	});
});

db.close();