const express = require('express')
const app = express()

var updater = require("./updater.js")
var updatingObjects = false

var program = require('commander');
program
    .version("pre-1")
    .option('-d, --download', 'Download and Update Data')
    .option('-u, --url [url]', 'Set URL')
    .parse(process.argv);

if (program.download)
{
    updateObjects()
}

function updateObjects()
{
    updatingObjects = true
    downloadPDFFile(function() {
        updater.updateSQLObjects(function() {
            updatingObjects = false
        })
    })
}

function downloadPDFFile(completion)
{
    var url = program.url ? program.url : 'http://jjcooley.ddns.net/2018F.pdf'
    console.log("Downloading From " + url)
    var download = require('download-file')
    var options = {
        directory: "./",
        filename: "courses.pdf"
    }

    download(url, options, function(err) {
        if (err) throw err
        console.log("Downloaded File!")
        completion()
    })
}

app.get('/query/', function(req, res) {
    if (!updatingObjects)
    {
        var sql = require("./sql.js")
        var con = sql.con

        var connectionPromise = sql.connectWithPromise()
        connectionPromise.then(value => {
            var sqlString = "select " + (req.query.column ? req.query.column : "*") + " from " + req.query.table + ((req.query.key != null && req.query.value != null) ? " where " + req.query.key + "=\"" + req.query.value + "\"" : "") + (req.query.where ? " where " + req.query.where : "")
            console.log("GET /query/ => " + sqlString)

            con.query(sqlString, function (err, result, fields) {
                res.json(result)
            })
        }, reason => {
            console.log(reason)
        })
    }
    else
    {
        console.log("GET /query/ => ERROR: Updating Objects!")
        res.status(500).send("ERROR: Updating Objects!")
    }
})

app.get('/update/', function(req, res) {
    if (!updatingObjects)
    {
        updatingObjects = true

        var updateObjectsFunction = function() {
            updater.updateSQLObjects(function() {
                console.log("GET /update/ => OK")
                res.status(200).send("OK")
                updatingObjects = false
            })
        }

        if (req.query.download)
        {
            downloadPDFFile(function() {
                updateObjectsFunction()
            })
        }
        else
        {
            updateObjectsFunction()
        }
    }
    else
    {
        console.log("GET /update/ => ERROR: Already Updating Objects!")
        res.status(500).send("ERROR: Already Updating Objects!")
    }
})

app.listen(3009, () => console.log('App listening on port 3009!'))
