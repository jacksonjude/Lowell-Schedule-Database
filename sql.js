/*var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "lowellscheduleremote",
  password: "GeeImaTree",
  database: "lowellschedule"
})

function handleDisconnect(client) {
	client.on('error', function (error) {
	    if (!error.fatal) return
	    if (error.code !== 'PROTOCOL_CONNECTION_LOST') throw err

	    console.error('Re-connecting lost MySQL connection: ' + error.stack)

	    // NOTE: This assignment is to a variable from an outer scope; this is extremely important
	    // If this said `client =` it wouldn't do what you want. The assignment here is implicitly changed
	    // to `global.mysqlClient =` in node.
	    mysqlClient = mysql.createConnection({
          host: "localhost",
          user: "lowellscheduleremote",
          password: "GeeImaTree",
          database: "lowellschedule"
        })
	    handleDisconnect(mysqlClient)
	    mysqlClient.connect()
	})
}

con.connect()
handleDisconnect(con)

exports.getConnection = function() {
    return con
}*/

//var mysql = require('mysql')

/*var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'lowellscheduleremote',
    password : 'GeeImaTree',
    database : 'lowellschedule'
})*/

/*var connection = mysql.createConnection({
    host     : 'sql3.freemysqlhosting.net',
    user     : 'sql3254932',
    password : 'e1vg5ffILT',
    database : 'sql3254932'
})

connection.on('error', function() {})

connection.query(sql, function(err, results) {
    callback(err, results)

    connection.end()
})*/

//const url = {user:"dmxmswykbqklyo", password:"93e4e3b96f3654dcc08388be361f61305e4dd2aa2103c28834c1e6db9a4433b4", host:"ec2-23-23-216-40.compute-1.amazonaws.com", port:5432, database:"d7ej3gchrhpje", ssl:true}


const { Client } = require('pg')
//const url = "postgres://dmxmswykbqklyo:93e4e3b96f3654dcc08388be361f61305e4dd2aa2103c28834c1e6db9a4433b4@ec2-23-23-216-40.compute-1.amazonaws.com:5432/d7ej3gchrhpje?ssl=true"
const url = process.env.DATABASE_URL + "?ssl=true"
var connection
var disconnectTimer

exports.query = function(sql, callback)
{
    if (connection == null)
    {
        connection = new Client(url)
        connection.connect()
    }

    if (disconnectTimer != null)
    {
        clearTimeout(disconnectTimer)
    }

    connection.query(sql, function(err, results) {
        callback(err, results)

        clearTimeout(disconnectTimer)
        disconnectTimer = setTimeout(function() {
            connection.end()
            connection = null
        }, 10000)
    })
}
