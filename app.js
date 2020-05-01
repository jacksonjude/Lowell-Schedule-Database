const express = require('express')
const app = express()
const fs = require('fs')
const uuidv4 = require('uuid/v4');
const PORT = process.env.PORT || 3009

var updater = require("./updater.js")
var updatingObjects = false

var getSeatsForClass = require("./live-selection.js").getSeatsForClass
var getArenaData = require("./live-selection.js").getArenaData

var sql = require("./sql.js")

app.use(express.json())
app.use(express.urlencoded(
{
  extended: true
}))
app.use(require('cors')(
{
  url: "*"
}))

app.get('/query/', function(req, res)
{
  if (updatingObjects)
  {
    console.log("GET /query/ => ERROR: Updating Objects")
    res.send("ERROR: Updating Objects")
    return
  }

  var sqlString = "select " + (req.query.distinct ? "distinct " : "") + (req.query.column ? req.query.column : "*") + " from " + req.query.table + ((req.query.key != null && req.query.value != null) ? " where " + req.query.key + "=\'" + req.query.value + "\'" : "") + (req.query.where ? " where " + req.query.where : "") + (req.query.group ? " group by " + req.query.group : "") + (req.query.order ? " order by " + req.query.order : "")

  if (process.env.INFO == "true")
  {
    console.log("GET /query/ => " + sqlString)
  }

  sql.query(sqlString, function(err, result)
  {
    res.json(result ? result.rows : [])
  })
})

app.get('/update/', function(req, res)
{
  if (process.env.UPDATES_ENABLED != 'true')
  {
    console.log("GET /update/ => ERROR: Updates not enabled")
    res.send("ERROR: Updates not enabled")
    return
  }

  if (updatingObjects)
  {
    console.log("GET /update/ => ERROR: Already Updating Objects")
    res.send("ERROR: Already Updating Objects")
    return
  }

  updatingObjects = true

  updater.updateSQLObjects(function()
  {
    console.log("GET /update/ => OK")
    res.send("OK")
    updatingObjects = false
  }, updater.getObjectsFromCSV)
})

app.post('/session/', function(req, res)
{
  if (updatingObjects)
  {
    console.log("POST /session/ => ERROR: Updating Objects")
    res.send("ERROR: Updating Objects")
    return
  }

  var reqBody = req.body

  if (reqBody.command == "save")
  {
    sqlString = "insert into sessions values (\'" + reqBody.id + "\', \'" + reqBody.coursesJSON + "\', \'" + reqBody.teachersJSON + "\', \'" + reqBody.offBlocksJSON + "\', \'" + reqBody.filtersJSON + "\', \'" + reqBody.favoriteSchedulesJSON + "\', \'" + uuidv4() + "\')" + " on conflict (id) do update set coursesJSON=\'" + reqBody.coursesJSON + "\', teachersJSON=\'" + reqBody.teachersJSON + "\', offBlocksJSON=\'" + reqBody.offBlocksJSON + "\', filtersJSON=\'" + reqBody.filtersJSON + "\', favoriteSchedulesJSON=\'" + reqBody.favoriteSchedulesJSON + "\'"

    if (process.env.INFO == "true")
    {
      console.log("POST /session/?command=save => " + sqlString)
    }
  }
  else if (reqBody.command == "load")
  {
    sqlString = "select * from sessions where id=\'" + reqBody.id + "\'"

    if (process.env.INFO == "true")
    {
      console.log("POST /session/?command=load => " + sqlString)
    }
  }
  else if (reqBody.command == "share")
  {
    sqlString = "select shareuuid from sessions where id=\'" + reqBody.id + "\'"

    if (process.env.INFO == "true")
    {
      console.log("POST /session/?command=share => " + sqlString)
    }
  }
  else if (reqBody.command == "loadShare")
  {
    sqlString = "select coursesjson, teachersjson, offblocksjson, filtersjson, favoriteschedulesjson, shareuuid from sessions where shareuuid=\'" + reqBody.shareUUID + "\'"

    if (process.env.INFO == "true")
    {
      console.log("POST /session/?command=loadShare => " + sqlString)
    }
  }
  else
  {
    console.log("POST /session/?command=" + reqBody.command + " => ERROR: Command Does Not Exist")
  }

  sql.query(sqlString, function(err, result, fields)
  {
    res.json(result ? result.rows : [])
  })
})

app.get('/seats/', async function(req, res)
{
  if (req.query.courseName != null && req.query.teacherName != null && req.query.blockNumber != null & req.query.scheduleCode != null)
  {
    await getSeatsForClass(req.query.courseName, req.query.teacherName, req.query.blockNumber, req.query.scheduleCode, process.env.COURSE_SELECTION_AUTH).then(function(seatCount) {
      res.send(seatCount)
    }, function(err) {
      res.send(err)
    })
  }
  else
  {
    res.send("ERROR: Required request arguments not found")
  }
})

app.get("/arena/", async function(req, res) {
  await getArenaData(process.env.COURSE_SELECTION_AUTH).then(function(data) {
    //var slicedData = data.slice(data.indexOf("<table"), data.indexOf("</table>"))
    //console.log("data -- " + data)
    res.send(data)
  }, function(err) {
    console.log("ERROR: " + err)
    res.send(err)
  })
})

app.get('/ping/', function(req, res)
{
  //console.log("GET /ping/ => 618")
  res.send("618")
})

app.get('/pingstart', function(req, res)
{
  if (process.env.INFO == "true")
  {
    console.log("GET /pingstart/")
  }

  if (!pingSet)
  {
    pingSet = true
    setTimeout(pingFunction, process.env.PING_INTERVAL)
    res.send("Ping set")
  }
  else
  {
    res.send("Ping already set")
  }
})

app.listen(PORT, () => console.log('App listening on port ' + PORT))

var http = require("http")
var pingSet = false
var pingFunction = function()
{
  pingSet = false

  http.get(process.env.HEROKU_URL + "/ping")

  console.log(Date.now())

  sql.query("select * from waketimes", function(err, result, fields)
  {
    if (result)
    {
      for (resultRow in result.rows)
      {
        if (parseInt(result.rows[resultRow].starttime) <= parseInt(Date.now()) && parseInt(result.rows[resultRow].endtime) >= parseInt(Date.now()))
        {
          pingSet = true
          setTimeout(pingFunction, process.env.PING_INTERVAL)
          break
        }
      }
    }
  })
}

setTimeout(pingFunction, process.env.PING_INTERVAL)
