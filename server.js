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
var globalEnrol, localRanks;
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
  let marks = marksObj[currentEnrol];
  let currentStuObj = marks[req.query.enrol];
  localRanks = getLocalRanks(marks);
  let rank = localRanks.indexOf(currentStuObj);
  currentStuObj.rank = rank + 1;
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
app.listen(3000, function() {
  console.log('Server up and running at http://localhost:3000');
})
