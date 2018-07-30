const express = require('express')
const app = express()

var updater = require("./updater.js")
var updatingObjects = false

var program = require('commander');
program
    .version("0.1")
    .option('-d, --download', 'Download and Update Data')
    .option('-u, --url [url]', 'Set URL')
    .parse(process.argv);

if (program.download)
{
    updateObjects()
}

const defaultSource = 'http://jjcooley.ddns.net/courses.pdf'

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

app.get('/query/', function(req, res) {
    if (!updatingObjects)
    {
        var sql = require("./sql.js")
        var con = sql.con

        var connectionPromise = sql.connectWithPromise()
        connectionPromise.then(value => {
            var sqlString = "select " + (req.query.column ? req.query.column : "*") + " from " + req.query.table + ((req.query.key != null && req.query.value != null) ? " where " + req.query.key + "=\"" + req.query.value + "\"" : "") + (req.query.where ? " where " + req.query.where : "")
            sqlString = sqlString.split(";")[0] ? sqlString.split(";")[0] : sqlString
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

app.listen(3009, () => console.log('App listening on port 3009'))
