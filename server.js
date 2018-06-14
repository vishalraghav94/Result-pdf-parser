var express = require('express');
var app = express();
var path = require('path');
var fs = require('fs');
var busboy = require('connect-busboy');
var child_process = require('child_process');
const nocache = require('superagent-no-cache');
const request = require('superagent');
const prefix = require('superagent-prefix')('/static');

app.use(busboy());
app.post('/upload', function(req, res) {
    console.log(req.body);
    var outputJsonFile = '';
    if (req.busboy) {

        req.pipe(req.busboy);
        var outputFile = [];
        req.busboy.on('field', function(key, value, keyTruncated, valueTruncated) {
            outputJsonFile += value + '_';
        });
        req.busboy.on('file', function(fieldname, file, filename) {
            var fstream = fs.createWriteStream('./' + filename);
            outputJsonFile = outputJsonFile.substr(0,outputJsonFile.lastIndexOf('_')) + '.json';
            file.pipe(fstream);
            fstream.on('close', function(err) {
                if (err) {
                    res.send({error: err});
                }
                child_process.exec('node test.js ' + filename + ' ' + outputJsonFile);
                res.send({data: 'file Uploaded'});
            })
        });

    }
});


const bodyParser = require('body-parser');
app.use(express.static(path.join(__dirname + '/public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var overall;
var marksObj;
console.log(marksObj);
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + 'public/index.html'));
});
var lastBranch;
var globalEnrol, localRanks, globalRanks, lastSem, lastInstitute, collegeRanks, overallCollegeRanks, overallGlobalRanks, overallLocalRanks;
app.get('/marks', function(req, res) {
    let enrol = req.query.enrol;
    let sem = req.query.sem || 5;
    let branch = req.query.branch || IT;
    let count = 1;
    let data = [];
    while(1) {
        try {
            let json = fs.readFileSync('./jsondata/' + branch + '_' + count++ + '.json');
            data.push(JSON.parse(json));
        } catch(e) {
            break;
        }
    }
    try {
        overall = fs.readFileSync('jsondata/overall_' + branch + '.json');
        overall = JSON.parse(overall);
    } catch(e) {
        makeOverallMarksObject(branch);
        setTimeout(function () {
            overall = fs.readFileSync('jsondata/overall_' + branch + '.json');
            overall = JSON.parse(overall);
        }, 1000);
    }

    try {
        if (sem >= count) {
            res.send({error: 'This sem\'s result doesnt exist.'});
        }
        marksObj = Object.assign({}, data[sem - 1]);
        let currentEnrol = enrol.substr(enrol.length - 8, enrol.length - 1);
        if (!globalEnrol || (globalEnrol !== currentEnrol)) {
            globalEnrol = currentEnrol;
        }
        let allSemMarks = [], s;
        for (s = 0; s < data.length; s++) {
            allSemMarks.push(data[s][currentEnrol] ? (data[s][currentEnrol][req.query.enrol] ? data[s][currentEnrol][req.query.enrol]['percent'] : 0) : 0);
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
        let collegeRank = collegeRanks.indexOfObj(currentStuObj.enrol);//collegeRanks.indexOf(currentStuObj);
        let overallRanks = {};
        overallRanks.rank = overallLocalRanks.indexOf(overallLocalRanks.find(e => (e.enrol === currentStuObj.enrol))) + 1;
        overallRanks.collegeRank = overallCollegeRanks.indexOf(overallCollegeRanks.find(e => (e.enrol === currentStuObj.enrol))) + 1;
        overallRanks.globalRank = overallGlobalRanks.indexOf(overallGlobalRanks.find(e => (e.enrol === currentStuObj.enrol))) + 1;
        let rank = localRanks.indexOf(currentStuObj);
        let globalRank = globalRanks.indexOfObj(currentStuObj.enrol);
        var newMarksObj = Object.assign({}, currentStuObj);
        newMarksObj.averageMarks = overall[currentEnrol][currentStuObj.enrol].averageMarks;
        newMarksObj.rank = rank + 1;
        newMarksObj.globalRank = globalRank + 1;
        newMarksObj.collegeRank = collegeRank + 1;
        newMarksObj.allSemMarks = allSemMarks;
        newMarksObj.overallRanks = overallRanks;
        res.send({data: newMarksObj});
    } catch(e) {
        res.send({error: 'No data'});
    }
});

app.get('/ranks', function(req, res) {
  let enrolOffset = req.query.enrol;
  let sem = req.query.sem || 5;
  let branch = req.query.branch || 'IT';
  let count = 1;
  let data = [];
    while(1) {
        try {
            let json = fs.readFileSync('./jsondata/' + branch + '_' + count++ + '.json');
            data.push(JSON.parse(json));
        } catch(e) {
            break;
        }
    }
  if (sem >= count) {
      res.send({error: 'This sem\'s result doesnt exist.'});
  }
  marksObj = data[sem - 1];
  let marks = marksObj[enrolOffset];
  localRanks = getLocalRanks(marks);
  res.send({data: localRanks});
});

app.post('/helloworld', function(req, res) {
    console.log("req accepted from slack.");

    var body = {
        response_type: "in_channel",
        "attachments": [
            {
                "text": "Hello, How are you?"
            }
        ]
    };
   res.send(body);
});

app.get('/globalRanks', function(req, res) {
    let branch = req.query.branch || 'IT';
    try {
        overall = fs.readFileSync('jsondata/overall_' + branch + '.json');
        overall = JSON.parse(overall);
    } catch(e) {
        makeOverallMarksObject(branch);
        setTimeout(function () {
            overall = fs.readFileSync('jsondata/overall_' + branch + '.json');
            overall = JSON.parse(overall);
        }, 1000);
    }
    if (!overall) {
        res.send({error: 'Mo data'});
    }
    overallGlobalRanks = overallGlobalRanks || getGlobalRanks(overall, true);
    res.send({data: overallGlobalRanks});
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


function makeOverallMarksObject(branch) {
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
    fs.writeFile("./jsondata/" + 'overall_' + branch + '.json', JSON.stringify(obj, null, 4), function(err) {
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

Array.prototype.indexOfObj = function(enrol) {
    var self = this;
    var index = -1;
    for (let i = 0; i < this.length; i++) {
        if (self[i].enrol === enrol) {
            index = i;
            break;
        }
    }
    return index;
};
app.listen(process.env.PORT || 4000, function() {
  console.log('Server up and running at http://localhost:4000');
});
