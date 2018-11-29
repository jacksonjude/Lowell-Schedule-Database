const express = require('express')
const app = express()
const fs = require('fs')
const PORT = process.env.PORT || 3009

var updater = require("./updater.js")
var updatingObjects = false

var program = require('commander');
program
    .version("0.1")
    .option('-d, --download', 'Download and Update Data')
    .option('-u, --url [url]', 'Set URL')
    .option('-i, --info', 'Info Console Output')
    .parse(process.argv);

if (program.url)
{
  var settings = getSettings()
  settings["defaultSourceURL"] = program.url
  writeSettings(settings)
}

const defaultSource = getSettings()["defaultSourceURL"]

function getSettings()
{
  return JSON.parse(fs.readFileSync('./settings.json', 'utf8'))
}

function writeSettings(array)
{
  fs.writeFileSync('./settings.json', JSON.stringify(array))
}

if (program.download)
{
  updateObjects()
}

function updateObjects()
{
  updatingObjects = true
  var url = program.url ? program.url : defaultSource
  downloadPDFFile(url, function() {
    updater.updateSQLObjects(function() {
      updatingObjects = false
    })
  })
}

function downloadPDFFile(url, completion)
{
  console.log("Downloading From " + url)
  var download = require('download-file')
  var options = {
    directory: "./",
    filename: "courses.pdf"
  }

  download(url, options, function(err) {
    if (err)
    {
      console.log(err)
      updatingObjects = false
      return
    }
    console.log("Downloaded File!")
    completion()
  })
}


app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(require('cors')({url:"https://jacksonjude.github.io"}))

app.get('/query/', function(req, res) {
  if (!updatingObjects)
  {
    var sqlString = "select " + (req.query.distinct ? "distinct " : "") + (req.query.column ? req.query.column : "*") + " from " + req.query.table + ((req.query.key != null && req.query.value != null) ? " where " + req.query.key + "=\'" + req.query.value + "\'" : "") + (req.query.where ? " where " + req.query.where : "") + (req.query.group ? " group by " + req.query.group : "") + (req.query.order ? " order by " + req.query.order : "")
    sqlString = sqlString.split(";")[0] ? sqlString.split(";")[0] : sqlString

    if (program.info)
    {
      console.log("GET /query/ => " + sqlString)
    }

    require("./sql.js").query(sqlString, function (err, result) {
      res.json(result ? result.rows : [])
    })
  }
  else
  {
    console.log("GET /query/ => ERROR: Updating Objects!")
    res.status(500).send("ERROR: Updating Objects!")
  }

  if (!pingSet)
  {
    setTimeout(pingFunction, 300000)
  }
})

app.get('/update/', function(req, res) {
  if (!updatingObjects)
  {
    updatingObjects = true

    downloadPDFFile((req.query.download ? req.query.download : defaultSource), function() {
      updater.updateSQLObjects(function() {
        console.log("GET /update/ => OK")
        res.status(200).send("OK")
        updatingObjects = false
      })
    })
  }
  else
  {
    console.log("GET /update/ => ERROR: Already Updating Objects!")
    res.status(500).send("ERROR: Already Updating Objects!")
  }
})

app.post('/session/', function(req, res) {
  if (!updatingObjects)
  {
    var reqBody = req.body

    if (reqBody.command == "save")
    {
      sqlString = "insert into sessions values (\'" + reqBody.id + "\', \'" + reqBody.coursesJSON + "\', \'" + reqBody.teachersJSON + "\', \'" + reqBody.offBlocksJSON + "\', \'" + reqBody.filtersJSON + "\', \'" + reqBody.favoriteSchedulesJSON + "\')" + " on conflict (id) do update set coursesJSON=\'" + reqBody.coursesJSON + "\', teachersJSON=\'" + reqBody.teachersJSON + "\', offBlocksJSON=\'" + reqBody.offBlocksJSON + "\', filtersJSON=\'" + reqBody.filtersJSON + "\', favoriteSchedulesJSON=\'" + reqBody.favoriteSchedulesJSON + "\'"

      if (program.info)
      {
        console.log("POST /session/?command=save => " + sqlString)
      }
    }
    else if (reqBody.command == "load")
    {
      sqlString = "select * from sessions where id=\'" + reqBody.id + "\'"

      if (program.info)
      {
        console.log("POST /session/?command=load => " + sqlString)
      }
    }
    else
    {
      console.log("POST /session/?command=" + reqBody.command + " => ERROR: Command Does Not Exist")
    }

    sqlString = sqlString.split(";")[0] ? sqlString.split(";")[0] : sqlString

    require("./sql.js").query(sqlString, function (err, result, fields) {
      res.json(result ? result.rows : [])
    })
  }
  else
  {
    console.log("POST /session/ => ERROR: Updating Objects!")
    res.status(500).send("ERROR: Updating Objects!")
  }
})

app.get('/ping/', function(req, res) {
  console.log("GET /ping/ => 618")
  res.send("618")
})

app.listen(PORT, () => console.log('App listening on port ' + PORT))

var http = require("http")
var pingSet = false
var pingFunction = function() {
  pingSet = false

  http.get(process.env.HEROKU_URL + "/ping")

  require("./sql.js").query("select * from waketimes", function (err, result, fields) {
    if (result && result.rows)
    {
      for (resultRow in result.rows)
      {
        if (resultRow.starttime <= Date.now().getTime() && resultRow.endtime >= Date.now().getTime())
        {
          pingSet = true
          setTimeout(pingFunction, 300000)
          break
        }
      }
    }
  })
}

setTimeout(pingFunction, 300000)
pingSet = true
