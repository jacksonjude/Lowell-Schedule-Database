var model = require("./model")

SchoolCourse = model.SchoolCourse
SchoolBlock = model.SchoolBlock

function singleSpace(str)
{
  return str.replace(/\s+/g, " ")
}

var ProgressBar = require('progress');
var bar = null
var barEnabled = false

function startIndexTest(rawText, text)
{
  return (rawText[text] == "1" && text != 1)
}

function getObjectsFromPDF()
{
  if (barEnabled)
    bar = new ProgressBar(':bar',
    {
      total: 100
    })

  var objectsPromise = new Promise((resolve, reject) =>
  {
    var PdfReader = require("pdfreader").PdfReader;
    var rawText = Array()

    var fileURL = "courses.pdf"

    console.log("   Loading from PDF...")

    new PdfReader().parseFileItems(fileURL, function(err, item)
    {
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
    if (startIndexTest(rawText, text))
    {
      startIndex = text
      break
    }
  }

  console.log("   Start Index: " + startIndex)

  if (barEnabled)
    bar = new ProgressBar(':bar',
    {
      total: rawText.length
    })

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

    if (tmpArray.length == 0 && parseInt(rawText[text]) != parseInt(departmentNumber) && parseInt(rawText[text]) - 1 != parseInt(departmentNumber))
    {
      if (!startedSkipping)
      {
        startedSkipping = true
        courses.pop()
        blocks.pop()
      }
      continue
    }
    else if (tmpArray.length == 0 && parseInt(rawText[text]) - 1 == parseInt(departmentNumber) && rawText[text].length == 1)
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

    if (tmpArray.length == 7) //UPDATE - # of columns
    {
      var blockCode = null
      var roomNumber = singleSpace(tmpArray[5])
      var blockNumber = tmpArray[4].trim()
      var teacherName = singleSpace(tmpArray[6])
      var courseCode = tmpArray[1].trim()
      var sectionNumber = tmpArray[3]

      //var newBlock = new SchoolBlock(require("./sha256.js").SHA256(courseName + teacherName + blockNumber), null, tmpArray[4].trim(), singleSpace(tmpArray[5]), singleSpace(tmpArray[6]), tmpArray[1].trim()) //UPDATE - Data from columns into block object
      var newSchoolBlock = new SchoolBlock(sectionNumber, blockCode, blockNumber, roomNumber, teacherName, courseCode)

      console.log(tmpArray)

      blocks.push(newBlock)

      if (sectionNumber == "80") //UPDATE - Special exceptions
        departmentNumber = "8"
      if (sectionNumber == "87")
        departmentNumber = "2"

      if (sectionNumber == "594")
        departmentNumber = "7"

      tmpArray = []
    }
  }

  console.log("   Created Objects!")

  return [courses, blocks]
}

function getObjectsFromCourseSelection()
{
  var objectsPromise = new Promise(async function(resolve, reject)
  {
    var arenaData = await require("./live-selection.js").getArenaData("4E96B90BA4FB2B4D544BE1543075D248D2605EEFBC0D1B35B8E7DC8331419C19877EC9317305BB5408053AC02FABB07E85CB7ACC637A63AD12BC7169C9448B19AF160C739D69B6A109AFFDEBD6119621D3749F5C9D40FCD003105B80BE20B70A2262C8DF72E5FA6ABD0002C92B649DCBC689B82D8FE8D6505C04DF3F96ED41544F63E88B16289286F9D78306BD0D6D40").then(function(data) {
      resolve(getObjectsFromTable(arenaData))
    })
  })

  return objectsPromise
}

function getObjectsFromTable(arenaData)
{
  var blocks = []
  var courses = []
  var departmentNum = 1
  var lastBlockNumber = 0

  for (rowNum in arenaData)
  {
    var blockCode = arenaData[rowNum][3]
    var blockNumber = arenaData[rowNum][2]
    var teacherName = arenaData[rowNum][1]
    var courseName = arenaData[rowNum][0]

    if (lastBlockNumber > 1 && blockNumber == 1)
      departmentNum++
    lastBlockNumber = blockNumber

    var newSchoolBlock = new SchoolBlock(require("./sha256.js").SHA256(courseName + teacherName + blockNumber), blockCode, blockNumber, null, teacherName, courseName)
    var newSchoolCouse = new SchoolCourse(departmentNum, courseName, courseName)

    blocks.push(newSchoolBlock)
    courses.push(newSchoolCouse)
  }

  return [courses, blocks]
}

async function loadObjectsToSQL(courses, blocks, completion)
{
  if (barEnabled)
    bar = new ProgressBar(':bar',
    {
      total: courses.length + blocks.length
    })

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

var updateSQLObjects = function(completion, objectFunction)
{
  var objectsPromise = objectFunction()
  objectsPromise.then(value =>
  {
    var courses = value[0]
    var blocks = value[1]

    console.log("   Loading objects to SQL...")

    loadObjectsToSQL(courses, blocks, function()
    {
      console.log("   Loaded to SQL!")

      if (completion != null)
      {
        completion()
      }
    })
  })
}

exports.updateSQLObjects = updateSQLObjects
exports.getObjectsFromCourseSelection = getObjectsFromCourseSelection
exports.getObjectsFromPDF = getObjectsFromPDF
