var express = require('express');
var app = express();
var path = require('path');
var fs = require('fs');
var busboy = require('connect-busboy');
const fileUpload = require('express-fileupload');
var child_process = require('child_process');
const bodyParser = require('body-parser');
const request = require('superagent');
var multer  = require('multer')
var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './uploads');
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  }
});
var upload = multer({ storage : storage}).single('myfile');
app.use(busboy());
app.use(express.static(path.join(__dirname + '/public')));
//app.use(bodyParser.urlencoded({ extended: true }));
//app.use(bodyParser.json());
app.post('/upload', function(req, res) {
  upload(req,res,function(err) {
        if(err) {
            return res.end("Error uploading file.");
        }
        convertToJson(res.req.file.filename, res.req.body, res);
       // res.send("File is uploaded successfully!");
    });
  /*  return;
    console.log('upload form: ',req);
    var outputJsonFile = '';
    if (req.busboy) {
        req.pipe(req.busboy);
        var outputFile = [];
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
    res.send({error: 'File not uploaded'});*/
});

var overall;
var marksObj;
console.log(marksObj);
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + 'public/index.html'));
});
var lastBranch;
var globalEnrol, localRanks, globalRanks, lastSem, lastInstitute, collegeRanks, overallCollegeRanks, overallGlobalRanks, overallLocalRanks;
let data;
app.get('/marks', function(req, res) {
    let enrol = req.query.enrol;
    let sem = req.query.sem || 5;
    sem = parseInt(sem);
    let branch = req.query.branch === "undefined" ?  'IT' : req.query.branch;
    let count = 1;
    data = [];
    while(count <= 8) {
        try {
            let json = fs.readFileSync('./jsondata/' + branch + '_' + count++ + '.json');
            data.push(JSON.parse(json));
        } catch(e) {
            data.push(undefined);
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
            if (data[s]) {
                allSemMarks.push(data[s][currentEnrol] ? (data[s][currentEnrol][req.query.enrol] ? data[s][currentEnrol][req.query.enrol]['percent'] : 0) : 0);
            }
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
    let payload = req.body.payload ? JSON.parse(req.body.payload) : undefined;


    var body = {
        "trigger_id": payload.trigger_id,
        "dialog": {
            "callback_id": payload.callback_id,
            "title": "Request a Ride",
            "submit_label": "Request",
            "notify_on_cancel": true,
            "elements": [
                {
                    "type": "text",
                    "label": "Pickup Location",
                    "name": "loc_origin"
                },
                {
                    "type": "text",
                    "label": "Dropoff Location",
                    "name": "loc_destination"
                }
            ]
        }
    };
    var authToken = 'xoxp-28632775939-380675780304-382632678855-12041307c7c9ac9f3050946a0f186659';
    if (payload && payload.callback_id === 'hello_world') {
        request.post('https://slack.com/api/dialog.open').set('Accept', 'application/json').set('Authorization', 'Bearer ' + authToken).send(body).end((err, res) => {
                if (err) {
                    console.log("Error occured", err);
                }
                else {
                    console.log("response is ::", res);
                }
        });
    }

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
    if (!data || !data.length) {
        return ;
    }
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

function convertToJson(filename, reqBody, res) {
  var outputJsonFile = reqBody.branch + '_' + reqBody.sem + '.json';
  filename = './uploads/' + filename;
  console.log(outputJsonFile);
  console.log('node test.js ' + filename + ' ' + outputJsonFile);
  child_process.exec('node test.js ' + filename + ' ' + outputJsonFile, function(err) {
      if (err) {
          res.send({error: 'File not uploaded'})
      }
      res.send({Success: 'file uploaded'});
  });
}
app.listen(process.env.PORT || 4000, function() {
  console.log('Server up and running at http://localhost:4000');
});
