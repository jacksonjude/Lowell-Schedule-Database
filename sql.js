const
{
  Client
} = require('pg')
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

  connection.query(sql, function(err, results)
  {
    callback(err, results)

    clearTimeout(disconnectTimer)
    disconnectTimer = setTimeout(function()
    {
      connection.end()
      connection = null
    }, 10000)
  })
}
