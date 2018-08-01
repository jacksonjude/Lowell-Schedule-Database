var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "lowellscheduleremote",
  password: "GeeImaTree",
  database: "lowellschedule"
});

var connectWithPromise = function()
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
exports.con = con
