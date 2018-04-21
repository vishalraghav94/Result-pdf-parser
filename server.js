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
console.log(data);
var marksObj;
console.log(marksObj);
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + 'public/index.html'));
});
var globalEnrol, localRanks, globalRanks, lastSem, lastInstitute, collegeRanks;
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
      allSemMarks.push(data[s][currentEnrol][req.query.enrol]['percent']);
  }
  let marks = marksObj[currentEnrol];
  let currentStuObj = marks[req.query.enrol];
  localRanks = getLocalRanks(marks);
  if ((lastSem !== sem) || !globalRanks) {
      globalRanks = getGlobalRanks(marksObj);
      collegeRanks = getCollegeRank(marksObj, currentStuObj.institute);
      lastSem = sem;
  }
  if ((lastInstitute !== currentStuObj.institute) || !collegeRanks) {
      collegeRanks = getCollegeRank(marksObj, currentStuObj.institute);
      lastInstitute = currentStuObj.institute;
  }
 // let collegeRanks = getCollegeRank(marksObj, currentStuObj.institute);
  let collegeRank = collegeRanks.indexOf(currentStuObj);
  //globalRanks = globalRanks || getGlobalRanks(marksObj);
  let rank = localRanks.indexOf(currentStuObj);
  let globalRank = globalRanks.indexOf(currentStuObj);
  currentStuObj.rank = rank + 1;
  currentStuObj.globalRank = globalRank + 1;
  currentStuObj.collegeRank = collegeRank + 1;
  currentStuObj.allSemMarks = allSemMarks;
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
function getLocalRanks(obj) {
  var arr = [];
  Object.keys(obj).forEach((e) => {
    arr.push(obj[e]);
  });
  arr = arr.sort(function(obj1, obj2) {
    return obj2.totalMarks - obj1.totalMarks;
  });
  return arr;
}
app.get('/globalrank', function(req, res) {
   let sem = req.query.sem;
   let obj = data[sem - 1];
   let arr = getGlobalRanks(obj);
   res.send({data: arr});
});
function getGlobalRanks(obj) {
    let marksArr = [];
    Object.keys(obj).forEach((e) =>{
        Object.keys(obj[e]).forEach((f) => {
            marksArr.push(obj[e][f]);
        })
    });
    marksArr = marksArr.sort((obj1, obj2) => obj2.totalMarks - obj1.totalMarks);
    return marksArr;
}

function getCollegeRank(obj, institute) {
    let newArr = [];
    Object.keys(obj).forEach((e) =>{
        Object.keys(obj[e]).forEach((f) => {
            if (obj[e][f].institute === institute)
                newArr.push(obj[e][f]);
        })
    });
    newArr = newArr.sort((obj1, obj2) => obj2.totalMarks - obj1.totalMarks);
    return newArr;
}
app.listen(3000, function() {
  console.log('Server up and running at http://localhost:3000');
})
