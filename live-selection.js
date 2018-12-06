//Sorry Alex and Chris
//I stole some cookies from the cookie jar

const fs = require('fs');
const rp = require('request-promise');
const tough = require('tough-cookie');

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
        console.log(className)
        console.log(matches)
        reject("ERR: RegExp error")
      }
    }
    var liveSelectionData = fs.readFileSync('./live-selection.json', 'utf8')
    if (liveSelectionData != null && Date.now()-JSON.parse(liveSelectionData)["updatedAt"] > 180000)
    {
      var data = JSON.parse(liveSelectionData)["data"]
      console.log(data)

      resolve(regexMatch(data, className, teacherName, blockNumber, scheduleCode))
    }
    else
    {
      let cookie = new tough.Cookie({
         key: ".ASPXAUTH",
         value: authCookie,
         domain: "www.lowell-courseselection.org",
         httpOnly: true,
      })

      var cookiejar = rp.jar()
      cookiejar._jar.rejectPublicSuffixes = false
      cookiejar.setCookie(cookie.toString(), 'http://www.lowell-courseselection.org')

      var options = {
         method: "GET",
         uri: 'http://www.lowell-courseselection.org/',
         jar: cookiejar,
      }

      rp(options).then(function(data) {
        console.log(data)
        fs.writeFileSync('./live-selection.json', JSON.stringify({"data":data, "updatedAt":Date.now()}))
        resolve(regexMatch(data, className, teacherName, blockNumber, scheduleCode))
      })
    }
  })

  return getSeatsPromse
}
