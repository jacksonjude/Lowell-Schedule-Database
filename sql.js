var mysql = require('mysql');

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
}

/*var connectWithPromise = function()
{
    var connectionPromise = new Promise( (resolve, reject) => {
        if (con.state === 'disconnected')
        {
            con.connect(function(err) {
              if (err)
              {
                  reject(err)
              }

              resolve()
            })
        }
        else
        {
            resolve()
        }
    })

    return connectionPromise
}

con.on('error', function(err) { console.log(err) });

exports.connectWithPromise = connectWithPromise
exports.con = con*/
