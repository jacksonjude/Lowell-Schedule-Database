//Sorry Alex and Chris
//I stole some cookies from the cookie jar

const fs = require('fs');
const rp = require('request-promise');
const tough = require('tough-cookie');

//const courseSelectionURL = "./pdf/lowellcourseselection.html"
const courseSelectionURL = "www.lowell-courseselection.org"

var currentSelectionData = '{"updatedAt":0}'

exports.getSeatsForClass = function(className, teacherName, blockNumber, scheduleCode, authCookie) {
  var getSeatsPromse = new Promise(function(resolve, reject) {
    var regexMatch = function(data, className, teacherName, blockNumber, scheduleCode) {
      var courseRegex = new RegExp("<tr>\\s*<td>" + className + "<\\/td><td>" + teacherName + "<\\/td><td>" + blockNumber + "<\\/td><td>" + scheduleCode + "<\\/td><td>(\\d*)<\\/td>\\s*<\\/tr>")
      var matches = courseRegex.exec(data)
      if (matches != null && matches.length > 1)
      {
        var seats = matches[1]
        return seats
      }
      else
      {
        console.log(data)
        console.log(courseRegex)
        console.log(matches)
        reject("ERR: RegExp error")
      }
    }
    //var liveSelectionData = fs.readFileSync('./live-selection.json', 'utf8')
    liveSelectionData = getCourseSelectionJSON()
    if (liveSelectionData != null && Date.now()-JSON.parse(liveSelectionData)["updatedAt"] > 180000 && JSON.parse(liveSelectionData)["data"] != null)
    {
      var data = JSON.parse(liveSelectionData)["data"]
      console.log("parse -- ")

      resolve(regexMatch(data, className, teacherName, blockNumber, scheduleCode))
    }
    else
    {
      let cookie = new tough.Cookie({
         key: ".ASPXAUTH",
         value: authCookie,
         domain: courseSelectionURL,
         httpOnly: true,
      })

      var cookiejar = rp.jar()
      cookiejar._jar.rejectPublicSuffixes = false
      cookiejar.setCookie(cookie.toString(), courseSelectionURL)

      var options = {
         method: "GET",
         uri: courseSelectionURL,
         jar: cookiejar,
      }

      rp(options).then(function(data) {
        console.log("rp -- ")
        //fs.writeFileSync('./live-selection.json', JSON.stringify({"data":data, "updatedAt":Date.now()}))
        writeCourseSelectionJSON(data)
        resolve(regexMatch(data, className, teacherName, blockNumber, scheduleCode))
      })
    }
  })

  return getSeatsPromse
}

exports.getArenaData = function(authCookie) {
  var getArenaDataPromse = new Promise(function(resolve, reject) {
    //var liveSelectionData = fs.readFileSync('./live-selection.json', 'utf8')
    var liveSelectionData = getCourseSelectionJSON()
    if (liveSelectionData != null && Date.now()-JSON.parse(liveSelectionData)["updatedAt"] < 180000 && JSON.parse(liveSelectionData)["data"] != null)
    {
      console.log("parse -- " + liveSelectionData + " -- " + Date.now()-JSON.parse(liveSelectionData)["updatedAt"])

      var data = JSON.parse(liveSelectionData)["data"]
      resolve(data)
    }
    else
    {
      let cookie = new tough.Cookie({
         key: ".ASPXAUTH",
         value: authCookie,
         domain: courseSelectionURL,
         httpOnly: true,
      })

      var cookiejar = rp.jar()
      cookiejar._jar.rejectPublicSuffixes = false
      cookiejar.setCookie(cookie.toString(), courseSelectionURL)

      var options = {
         method: "GET",
         uri: courseSelectionURL,
         jar: cookiejar,
      }

      rp(options).then(function(data) {
        console.log("rp -- ")
        //fs.writeFileSync('./live-selection.json', JSON.stringify({"data":data, "updatedAt":Date.now()}))
        writeCourseSelectionJSON(data)
        resolve(data)
      })

      /*fs.readFile(courseSelectionURL, 'utf8', function(err, data) {
        writeCourseSelectionJSON(data)
        resolve(data)
      })*/
    }
  })

  return getArenaDataPromse
}

function getCourseSelectionJSON()
{
  return currentSelectionData
}

function writeCourseSelectionJSON(data)
{
  currentSelectionData = JSON.stringify({"data":data, "updatedAt":Date.now()})
}
