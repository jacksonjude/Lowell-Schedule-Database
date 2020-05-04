var sql = require("./sql.js")

function SchoolCourse(departmentNum, courseCode, courseName, semester)
{
  this.departmentNum = departmentNum
  this.courseCode = courseCode
  this.courseName = courseName
  this.semester = semester ? semester : 0
}

SchoolCourse.prototype.loadToSQL = function()
{
  var loadToSQLPromise = new Promise((resolve, reject) =>
  {
    var course = this

    sql.query("select count(*) from courses where courseCode=\'" + course.courseCode + "\'", function(err, result, fields)
    {
      if (result == null || parseInt(result["rows"][0]["count"]) == 0)
      {
        sql.query("insert into courses values ('" + course.departmentNum + "', '" + course.courseCode + "', '" + course.courseName + "', '" + course.semester + "')", function(err, result, fields)
        {
          resolve()
        })
      }
      else
      {
        resolve()
      }
    })
  })

  return loadToSQLPromise
}

function SchoolBlock(sectionNumber, blockCode, blockNum, roomNum, teacher, courseCode)
{
  this.sectionNumber = sectionNumber
  this.blockCode = blockCode
  this.blockNum = blockNum
  this.roomNum = roomNum
  this.teacher = teacher
  this.courseCode = courseCode
}

SchoolBlock.prototype.loadToSQL = function()
{
  var loadToSQLPromise = new Promise((resolve, reject) =>
  {
    var block = this

    sql.query("select count(*) from blocks where sectionNumber=\'" + block.sectionNumber + "\'", function(err, result, fields)
    {
      if (result == null || parseInt(result["rows"][0]["count"]) == 0)
      {
        sql.query("insert into blocks values ('" + block.sectionNumber + "', '" + block.blockCode + "', " + block.blockNum + ", '" + block.roomNum + "', '" + block.teacher + "', '" + block.courseCode + "')", function(err, result, fields)
        {
          resolve()
        })
      }
      else
      {
        resolve()
      }
    })
  })

  return loadToSQLPromise
}

exports.SchoolCourse = SchoolCourse
exports.SchoolBlock = SchoolBlock
