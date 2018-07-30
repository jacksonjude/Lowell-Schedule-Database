var model = require("./model")

SchoolCourse = model.SchoolCourse
SchoolBlock = model.SchoolBlock

var updatingObjects = false

function singleSpace(str)
{
    return str.replace(/\s+/g, " ")
}

var ProgressBar = require('progress');
var bar = null
var barEnabled = false

function getObjectsFromPDF()
{
    if (barEnabled)
        bar = new ProgressBar(':bar', { total: 100 })

    var objectsPromise = new Promise( (resolve, reject) => {
        var PdfReader = require("pdfreader").PdfReader;
        var rawText = Array()

        //var startIndexTest = ()
        //var pageBreakTest = ()
        var fileURL = "2018F.pdf"
        //var fileURL = "http://lhs-sfusd-ca.schoolloop.com/file/1239686293231/1239686294994/6183066267819394189.pdf"

        console.log("   Loading from PDF...")

        new PdfReader().parseFileItems(fileURL, function(err, item){
            if (item && item.text)
            {
                rawText.push(item.text)
            }
            else if (!item)
            {
                console.log("   Loaded rawText!")

                if (barEnabled)
                    bar.tick(100)

                var objects = getObjectsFromRawText(rawText)

                resolve(objects)
            }
        })
    })

    return objectsPromise
}

function getObjectsFromRawText(rawText)
{
    var courses = []
    var blocks = []

    var startIndex = null

    for (text in rawText)
    {
        if (rawText[text] == "1" && text != 1)
        {
            startIndex = text
            break
        }
    }

    console.log("   Start Index: " + startIndex)

    if (barEnabled)
        bar = new ProgressBar(':bar', { total: rawText.length })

    console.log("   Creating Objects...")

    var tmpArray = []
    var skipsLeft = 0
    var departmentNumber = "1"
    var startedSkipping = false

    for (text in rawText)
    {
        if (barEnabled)
            bar.tick()

        if (rawText[text] == rawText[0])
        {
            tmpArray = []
            skipsLeft = startIndex
        }

        if (skipsLeft > 0)
        {
            skipsLeft -= 1
            continue
        }

        if (tmpArray.length == 0 && parseInt(rawText[text]) != parseInt(departmentNumber) && parseInt(rawText[text])-1 != parseInt(departmentNumber))
        {
            if (!startedSkipping)
            {
                startedSkipping = true
                courses.pop()
                blocks.pop()
            }
            continue
        }
        else if (tmpArray.length == 0 && parseInt(rawText[text])-1 == parseInt(departmentNumber) && rawText[text].length == 1)
        {
            departmentNumber = rawText[text]
        }

        startedSkipping = false

        tmpArray.push(rawText[text])

        if (tmpArray.length == 3)
        {
            var newCourse = new SchoolCourse(tmpArray[0].trim(), tmpArray[1].trim(), singleSpace(tmpArray[2]))

            var courseExists = false
            for (course in courses)
            {
                if (courses[course].departmentNum == newCourse.departmentNum, courses[course].courseCode == newCourse.courseCode, courses[course].courseName == newCourse.courseName)
                {
                    courseExists = true
                    break
                }
            }

            if (!courseExists)
            {
                courses.push(newCourse)
            }
        }

        if (tmpArray.length == 8)
        {
            var newBlock = new SchoolBlock(tmpArray[3].trim(), tmpArray[4].trim(), tmpArray[5].trim(), singleSpace(tmpArray[6]), singleSpace(tmpArray[7]), tmpArray[1].trim())

            blocks.push(newBlock)

            tmpArray = []
        }
    }

    console.log("   Created Objects!")

    return [courses, blocks]
}

async function loadObjectsToSQL(courses, blocks, completion)
{
    if (barEnabled)
        bar = new ProgressBar(':bar', { total: courses.length + blocks.length })

    for (course in courses)
    {
        var coursePromise = courses[course].loadToSQL()
        await coursePromise

        if (barEnabled)
            bar.tick()
    }

    for (block in blocks)
    {
        var blockPromise = blocks[block].loadToSQL()
        await blockPromise

        if (barEnabled)
            bar.tick()
    }

    completion()
}

function updateSQLObjects(completion)
{
    updatingObjects = true

    var objectsPromise = getObjectsFromPDF()
    objectsPromise.then( value => {
        var courses = value[0]
        var blocks = value[1]

        console.log("   Loading objects to SQL...")

        loadObjectsToSQL(courses, blocks, function() {
            console.log("   Loaded to SQL!")
            updatingObjects = false

            if (completion != null)
            {
                completion()
            }
        })
    })
}

//updateSQLObjects()

const express = require('express')
const app = express()

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
        updateSQLObjects(function() {
            console.log("GET /update/ => OK")
            res.status(200).send("OK")
        })
    }
    else
    {
        console.log("GET /update/ => ERROR: Already Updating Objects!")
        res.status(500).send("ERROR: Already Updating Objects!")
    }
})

app.listen(3009, () => console.log('App listening on port 3009!'))
