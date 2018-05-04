var pdfreader = require('pdfreader');
var fs = require('fs');
var child_process = require('child_process');
var file = process.argv[2];
var dest_file = process.argv[3];
var subjects;
console.log(file);
console.log('pdfseparate ' + file + ' pdf_pages/%d.pdf');
child_process.exec('mkdir pdf_pages');
child_process.exec('pdfseparate ' + file + ' pdf_pages/%d.pdf',function (error, stdout, stderr) {
      if (error) {
         //console.log(error.stack);
         //console.log('Error code: '+error.code);
         //console.log('Signal received: '+error.signal);
      }
      //console.log('stdout: ' + stdout);
      //console.log('stderr: ' + stderr);
   });
var megaFinalArray = [];
var rows = {}; // indexed by y-position
var newArr = [];
var filename = 'pdf_pages/';
var subFlag = false;
function printRows() {
    var instituteString;
  newArr = [];
  Object.keys(rows) // => array of y-positions (type: float)
    .sort((y1, y2) => parseFloat(y1) - parseFloat(y2)) // sort float positions
    .forEach(function(y) {
      newArr.push((rows[y] || []).join(','));
    });
    if (newArr.length > 1) {
        if (newArr[13].indexOf('Institution Code') !== -1) {
            let str = newArr[13];
            instituteString = str.substr(str.lastIndexOf('Institution') + 'Institution: '.length, str.length);
            instituteString = instituteString.split(',').join('');
            instituteString = instituteString.split(' ').filter(e => e).join(' ');
        }
        if (!subFlag) {
            var subArray = newArr.filter((e, i) => i % 2);
            subjects = subArray.map((e) => {
                let id = e.split(',')[1];
                let code = e.split(',')[2];
                let sub = e.split(',')[3];
                let obj = {};
                obj.id = id;
                obj.code = code;
                obj.sub = sub;
                return obj;
            });
            subjects = subjects.splice(4,subjects.length);
            subFlag = true;
        }
    }
    newArr.splice(0, 14);
    newArr.splice(newArr.length - 4, 4);
    var finalArray;
    if (newArr.length > 1) {
      newArr = getFormattedArray(newArr);
      finalArray = getMarksObject(newArr, instituteString);
    }
    //console.log(finalArray);
    megaFinalArray.push(finalArray);
}
function getMarksObject(arr, institute) {
  var i, obj = {}, finalArray = [];
  for (i = 0; i < arr.length; i++) {
    obj = getFormattedObj(arr[i], institute);
    //obj.institute = institute.split(',').join('');
    finalArray.push(obj);
  }
  return finalArray;
}
function parseMarksString(marksString) {
  marksString.split(',').map(function(ele) {
    return parseInt(ele.substring(0,indexOf('(')));
  })
  var totalMarks = 0, i;
  for (i = 0; i < marksString.length; i++) {
    totalMarks += marksString[i];
  }
  return totalMarks;
}
function getFormattedObj(arr,institute) {
  var i, obj = {};
  for (i = 0; i < arr.length; i++) {
    switch (i) {
      case 0:
        obj['enrol'] = arr[i].split(',')[0];
        break;
      case 2:
        obj['name'] = arr[i];
        break;
      case 6:
        obj['marks'] = parseMarksString(arr[i]); //Math.round(parseMarksString(arr[i])*100)/100; //parseMarksString(arr[i]);
      default:

    }
  }
  obj['institute'] = institute;
  return obj;
}
function parseMarksString(marksString) {
  marksString = marksString.split(',');
  marksString = marksString.map(function(ele) {
    return parseInt(ele.substring(0,ele.indexOf('('))) || 0;
  });
  var totalMarks = 0, i;
  for (i = 0; i < marksString.length; i++) {
    totalMarks += marksString[i];
  }
  return marksString; //totalMarks/marksString.length; // marksString;
}
function getFormattedArray(arr) {
  var newArr = [], i;
  var size = 8;
  for (i = 0; i < arr.length;) {
      newArr.push(arr.slice(i, i + (size - 1)));
      i = i + size;
  }
  return newArr;
}

var k = 1;
var interval = setInterval(function() {
  console.log(filename + k + '.pdf');
  new pdfreader.PdfReader().parseFileItems(filename + k + '.pdf', function(err, item){
    if (!item || item.page) {
      // end of file, or page
      printRows();
      rows = {}; // clear rows for next page
    }
    else if (item.text) {
      // accumulate text items into rows object, per line
      (rows[item.y] = rows[item.y] || []).push(item.text);
    }
  });
  k++;
  if (k >=150) {
    clearInterval(interval);
  }
}, 150);


function validObject(obj) {
  if (obj.marks == 0) {
    obj.marks = 1;
  }
  if (!obj.name || !obj.marks || !obj.enrol) {
    return false;
  }
  if (!parseInt(obj.enrol)) {
      return false;
  }
  if (!/^[a-zA-z ]+$/gi.test(obj.name)) {
    return false;
  }
  if (obj.marks == 1) {
    obj.marks = 0;
  }
  return true;
}

setTimeout(function() {
  megaFinalArray = megaFinalArray.filter((e) => e && e.length);
  var i;
  for (i = 0; i < megaFinalArray.length; i++) {
    megaFinalArray[i] = megaFinalArray[i].filter((e) => validObject(e));
  }
  megaFinalArray = megaFinalArray.filter((e) => e && e.length);
  megaFinalArray = megaFinalArray.map((e, y) => {
    var obj = {}, i;
    for (i = 0; i < e.length; i++) {
        let marksObj = {};
      e[i]['totalMarks'] = getTotalMarks(e[i].marks);
        //console.log('enrol:' + e[i].enrol);
    //console.log(e[i].marks);
    //console.log("I: %%%%%%%%%% "+ i + " %%%%%%% y: " + y);
      e[i].marks.forEach((f, i) => {
        marksObj[subjects[i].sub] = f;
      });
      var totalSub = e[i].marks.length;
      e[i].marks = marksObj;
      e[i].percent = Math.round((e[i].totalMarks/totalSub) * 100) / 100;
      e[i].totalSub = totalSub;
      marksObj = {};
      obj[e[i].enrol] = e[i];
    }
    return obj;
  });
  var newObj = Object.assign({}, ...megaFinalArray);
  var enrolStr = Object.keys(newObj)[0];
  var finalObj = {};
  enrolStr = enrolStr.substr(enrolStr.length - 8, enrolStr.length - 1);
    //let obj = {};
    finalObj[enrolStr] = {};
    Object.keys(newObj).forEach((e) => {
    if ((e.indexOf(enrolStr) !== -1)) {
        //obj[e] = Object.assign({}, newObj[e]);
       finalObj[enrolStr][e] = Object.assign({}, newObj[e]);
    }
    else {
        enrolStr = e.substr(e.length - 8, e.length - 1);
        finalObj[enrolStr] = {};
        finalObj[enrolStr][e] = Object.assign({}, newObj[e]);
    }
  });
  //console.log(newObj);

  fs.writeFile("./jsondata" + dest_file, JSON.stringify(finalObj, null, 4), function(err) {
      if(err) {
          return //console.log(err);
      }

      //console.log("The file was saved!");
  });
  child_process.exec('rm -rf pdf_pages/');
}, 27000);

function getTotalMarks(arr) {
    var totalMarks = 0, i;
    for (i = 0; i < arr.length; i++) {
        totalMarks += arr[i];
    }
    return totalMarks;
}
