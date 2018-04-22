var express = require('express');
var app = express();
var path = require('path');
var fs = require('fs');
const bodyParser = require('body-parser');
app.use(express.static(path.join(__dirname + '/public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var data = [];
var count = 0;
while(1) {
  try {
    let json = fs.readFileSync((count+ 1) + 'sem.json');
    data.push(JSON.parse(json));
    count++;
  } catch(e) {
    break;
  }
}
var overall;
try {
    overall = fs.readFileSync('overall.json');
    overall = JSON.parse(overall);
} catch(e) {
    makeOverallMarksObject();
    setTimeout(function () {
        overall = fs.readFileSync('overall.json');
        overall = JSON.parse(overall);
    }, 1000);
}
console.log(data);
var marksObj;
console.log(marksObj);
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + 'public/index.html'));
});
var globalEnrol, localRanks, globalRanks, lastSem, lastInstitute, collegeRanks, overallCollegeRanks, overallGlobalRanks, overallLocalRanks;
app.get('/marks', function(req, res) {
    let enrol = req.query.enrol;
    let sem = req.query.sem || 5;
    if (sem > count) {
        res.send({error: 'This sem\'s result doesnt exist.'});
    }
    marksObj = data[sem - 1];
  let currentEnrol = enrol.substr(enrol.length - 8, enrol.length - 1);
  if (!globalEnrol || (globalEnrol !== currentEnrol)) {
    globalEnrol = currentEnrol;
  }
  let allSemMarks = [], s;
  for (s = 0; s < data.length; s++) {
      allSemMarks.push(data[s][currentEnrol] ? data[s][currentEnrol][req.query.enrol]['percent'] : 0);
  }
  let marks = marksObj[currentEnrol];
  let currentStuObj = marks[req.query.enrol];
  localRanks = getLocalRanks(marks);
  overallLocalRanks = getLocalRanks(overall[currentEnrol], true);
  if ((lastSem !== sem) || !globalRanks) {
      globalRanks = getGlobalRanks(marksObj);
      collegeRanks = getCollegeRank(marksObj, currentStuObj.institute);
      lastSem = sem;
  }
  if ((lastInstitute !== currentStuObj.institute) || !collegeRanks) {
      collegeRanks = getCollegeRank(marksObj, currentStuObj.institute);
      overallCollegeRanks = getCollegeRank(overall, currentStuObj.institute, true);
      lastInstitute = currentStuObj.institute;
  }
  if (!overallGlobalRanks) {
      overallGlobalRanks = getGlobalRanks(overall, true);
  }
 // let collegeRanks = getCollegeRank(marksObj, currentStuObj.institute);
  let collegeRank = collegeRanks.indexOf(currentStuObj);
  let overallRanks = {};
  overallRanks.rank = overallLocalRanks.indexOf(overallLocalRanks.find(e => (e.enrol === currentStuObj.enrol))) + 1;
  overallRanks.collegeRank = overallCollegeRanks.indexOf(overallCollegeRanks.find(e => (e.enrol === currentStuObj.enrol))) + 1;
  overallRanks.globalRank = overallGlobalRanks.indexOf(overallGlobalRanks.find(e => (e.enrol === currentStuObj.enrol))) + 1;
  //globalRanks = globalRanks || getGlobalRanks(marksObj);
  let rank = localRanks.indexOf(currentStuObj);
  let globalRank = globalRanks.indexOf(currentStuObj);
  currentStuObj.averageMarks = overall[currentEnrol][currentStuObj.enrol].averageMarks;
  currentStuObj.rank = rank + 1;
  currentStuObj.globalRank = globalRank + 1;
  currentStuObj.collegeRank = collegeRank + 1;
  currentStuObj.allSemMarks = allSemMarks;
  currentStuObj.overallRanks = overallRanks;
  res.send({data: currentStuObj});
});

app.get('/ranks', function(req, res) {
  let enrolOffset = req.query.enrol;
  let sem = req.query.sem || 5;
  if (sem > count) {
      res.send({error: 'This sem\'s result doesnt exist.'});
  }
  marksObj = data[sem - 1];
  let marks = marksObj[enrolOffset];
  localRanks = getLocalRanks(marks);
  res.send({data: localRanks});
});
function getLocalRanks(obj, isOverallRanks) {
  var arr = [];
  Object.keys(obj).forEach((e) => {
    arr.push(obj[e]);
  });
  if (isOverallRanks) {
      arr = arr.sort(function(obj1, obj2) {
          return obj2.averageMarks - obj1.averageMarks;
      });
  }
  else {
      arr = arr.sort(function(obj1, obj2) {
          return obj2.totalMarks - obj1.totalMarks;
      });
  }
  return arr;
}
app.get('/globalrank', function(req, res) {
   let sem = req.query.sem;
   let obj = data[sem - 1];
   let arr = getGlobalRanks(obj);
   res.send({data: arr});
});
function getGlobalRanks(obj, isOverallRank) {
    let marksArr = [];
    Object.keys(obj).forEach((e) =>{
        Object.keys(obj[e]).forEach((f) => {
            marksArr.push(obj[e][f]);
        })
    });
    if (isOverallRank) {
        marksArr = marksArr.sort((obj1, obj2) => obj2.averageMarks - obj1.averageMarks);
    }
    else {
        marksArr = marksArr.sort((obj1, obj2) => obj2.totalMarks - obj1.totalMarks);
    }

    return marksArr;
}


function makeOverallMarksObject() {
    var obj = Object.assign({}, data[data.length - 1]);
    Object.keys(obj).forEach((e) => {
       Object.keys(obj[e]).forEach(f => {
           let allSemMarks = getOverallMarks(f);
           allSemMarks = allSemMarks.filter(e => e > 0);
          obj[e][f].allSemMarks = allSemMarks;
          let averageMarks = 0;
           allSemMarks.forEach(e => {
               averageMarks += e;
           });
           obj[e][f].averageMarks = Math.round((averageMarks / allSemMarks.length) * 100) / 100
       });
    });
    fs.writeFile("./" + 'overall.json', JSON.stringify(obj, null, 4), function(err) {
        if(err) {
            return //console.log(err);
        }

        //console.log("The file was saved!");
    });
    //return obj;
}

function getOverallMarks(enrol) {
    let s;
    console.log('getOverall: ' + enrol);
    let enrolOffset = enrol.substr(enrol.length - 8, enrol.length - 1);
    let allSemMarks = [];
    for (s = 0; s < data.length; s++) {
        console.log('sem: ' + s);
        allSemMarks.push(data[s][enrolOffset] ? (data[s][enrolOffset][enrol] ? data[s][enrolOffset][enrol]['percent'] : 0) : 0);
    }
    /*let averageMarks = 0;
    allSemMarks.forEach(e => {
        averageMarks += e;
    });*/
    return allSemMarks;
}

function getCollegeRank(obj, institute, isOverallRank) {
    let newArr = [];
    Object.keys(obj).forEach((e) =>{
        Object.keys(obj[e]).forEach((f) => {
            if (obj[e][f].institute === institute)
                newArr.push(obj[e][f]);
        })
    });
    if (isOverallRank) {
        newArr = newArr.sort((obj1, obj2) => obj2.averageMarks - obj1.averageMarks);
    }
    else {
        newArr = newArr.sort((obj1, obj2) => obj2.totalMarks - obj1.totalMarks);
    }

    return newArr;
}
app.listen(3000, function() {
  console.log('Server up and running at http://localhost:3000');
});
