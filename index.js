var startIndex = null

var PdfReader = require("pdfreader").PdfReader;
var rawText = Array()
new PdfReader().parseFileItems("sample.pdf", function(err, item){
    if (item && item.text)
    {
        rawText.push(item.text)
    }
    else if (!item)
    {
        for (text in rawText)
        {
            if (rawText[text] == "1" && text != 1)
            {
                startIndex = text
                break
            }
        }

        console.log(startIndex)

        var tmpArray = []
        var skipsLeft = 0

        var model = require("./model")

        SchoolCourse = model.SchoolCourse
        SchoolBlock = model.SchoolBlock

        var courses = new Set([])
        var blocks = new Set([])

        for (text in rawText)
        {
            if (rawText[text] == rawText[0])
            {
                console.log("SKIPP")
                tmpArray = []
                skipsLeft = startIndex
            }

            if (skipsLeft > 0)
            {
                skipsLeft -= 1
                continue
            }

            tmpArray.push(rawText[text])

            if (tmpArray.length == 3)
            {
                var course = new SchoolCourse(tmpArray[0], tmpArray[1], tmpArray[2])
                //course.loadToSQL()
                courses.add(course)
            }

            if (tmpArray.length == 8)
            {
                var block = new SchoolBlock(tmpArray[4], tmpArray[5], tmpArray[6], tmpArray[7], tmpArray[1])
                //block.loadToSQL()
                blocks.add(block)

                tmpArray = []
            }
        }

        console.log("something")
    }
});

const express = require('express')
const app = express()

app.get('/', (req, res) => res.send('Hello World!'))

app.listen(3009, () => console.log('Example app listening on port 3000!'))

/*SchoolCourse = require("./model").SchoolCourse

var course = new SchoolCourse("1", "ABC123", "Test Course")
course.loadToSQL()*/
