var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('db/test.db');

db.serialize(function() {
	test = db.run('INSERT INTO users VALUES ("jacksarick", "Jack Sarick", "mypass", "thesalt");');
	console.log("Test 1: " + JSON.stringify(test));

	test = db.run('INSERT INTO users VALUES ("jacksarick", "Jack Sarick", "mypass", "thesalt");');
	console.log("Test 2: " + JSON.stringify(test));
});

db.close();