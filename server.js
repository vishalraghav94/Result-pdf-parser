var express = require('express');
var app = express();
var path = require('path');
var fs = require('fs');
const bodyParser = require('body-parser');
app.use(express.static(path.join(__dirname + '/public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var data = fs.readFileSync('3rdsem.json');
const marksObj = JSON.parse(data);

console.log(marksObj);
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + 'public/index.html'));
});
var globalEnrol, localRanks;
app.get('/marks', function(req, res) {
    let enrol = req.query.enrol;
  let currentEnrol = enrol.substr(enrol.length - 8, enrol.length - 1);
  if (!globalEnrol || (globalEnrol !== currentEnrol)) {
    globalEnrol = currentEnrol;
  }
  let marks = marksObj[currentEnrol];
  let currentStuObj = marks[req.query.enrol];
  let rank = localRanks.indexOf(currentStuObj);
  currentStuObj.rank = rank + 1;
  res.send({data: currentStuObj});
});

app.get('/ranks', function(req, res) {
  let enrolOffset = req.query.enrol;
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
