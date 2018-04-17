var express = require('express');
var app = express();
var path = require('path');
var fs = require('fs');
const bodyParser = require('body-parser');
app.use(express.static(path.join(__dirname + '/public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var data = fs.readFileSync('3rdsem.json');
const marks = JSON.parse(data);
console.log(marks);
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + 'public/index.html'));
})
app.get('/marks', function(req, res) {
  res.send({data: marks[req.query.enrol]});
});
app.listen(3000, function() {
  console.log('Server up and running at http://localhost:3000');
})
