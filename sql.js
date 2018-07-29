var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "REDACTED",
  database: "lowellschedule"
});

exports.con = con
