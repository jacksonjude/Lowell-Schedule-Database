function SchoolCourse(departmentNum, courseCode, courseName) {
    this.departmentNum = departmentNum
    this.courseCode = courseCode
    this.courseName = courseName
}

SchoolCourse.prototype.loadToSQL = function() {
    var con = require("./sql.js").con
    var course = this

    con.connect(function(err) {
      if (err) throw err;

      con.query("insert into courses values ('" + course.departmentNum + "', '" + course.courseCode + "', '" + course.courseName + "')")
    });
}

function SchoolBlock(blockCode, blockNum, roomNum, teacher, courseCode) {
    this.blockCode = blockCode
    this.blockNum = blockNum
    this.roomNum = roomNum
    this.teacher = teacher
    this.courseCode = courseCode
}

SchoolBlock.prototype.loadToSQL = function() {
    var con = require("./sql.js").con
    var block = this

    con.connect(function(err) {
      if (err) throw err;

      con.query("insert into courses values ('" + block.blockCode + "', '" + block.blockNum + "', '" + block.roomNum + "', '" + block.teacher + "', '" + block.courseCode + "')")
    });
}

exports.SchoolCourse = SchoolCourse
exports.SchoolBlock = SchoolBlock
