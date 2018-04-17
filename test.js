var pdfreader = require('pdfreader');
var fs = require('fs');
var child_process = require('child_process');
var file = process.argv[2];
var dest_file = process.argv[3];
console.log(file);
console.log('pdfseparate ' + file + ' pdf_pages/%d.pdf');
child_process.exec('mkdir pdf_pages');
child_process.exec('pdfseparate ' + file + ' pdf_pages/%d.pdf',function
      (error, stdout, stderr) {
      if (error) {
         console.log(error.stack);
         console.log('Error code: '+error.code);
         console.log('Signal received: '+error.signal);
      }
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
   });
var megaFinalArray = [];
var rows = {}; // indexed by y-position
var newArr = [];
var filename = 'pdf_pages/';
function printRows() {
  newArr = [];
  Object.keys(rows) // => array of y-positions (type: float)
    .sort((y1, y2) => parseFloat(y1) - parseFloat(y2)) // sort float positions
    .forEach(function(y) {
      newArr.push((rows[y] || []).join(','));
    });
    newArr.splice(0, 14);
    newArr.splice(newArr.length - 4, 4);
    var finalArray;
    if (newArr.length > 1) {
      newArr = getFormattedArray(newArr);
      finalArray = getMarksObject(newArr);
    }
    console.log(finalArray);
    megaFinalArray.push(finalArray);
}
function getMarksObject(arr) {
  var i, obj = {}, finalArray = [];
  for (i = 0; i < arr.length; i++) {
    obj = getFormattedObj(arr[i]);
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
function getFormattedObj(arr) {
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
        obj['marks'] = Math.round(parseMarksString(arr[i])*100)/100;
      default:

    }
  }
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
  return totalMarks/(marksString.length);
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
}, 300);
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
  if (obj.name.indexOf(',') !== -1) {
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
  /*  megaFinalArray[i] = megaFinalArray[i].map((e) => {
      var obj = {};
      obj[e.enrol] = e;
      return obj;
    });*/
  }
  megaFinalArray = megaFinalArray.filter((e) => e && e.length);
  megaFinalArray = megaFinalArray.map((e) => {
    var obj = {}, i;
    for (i = 0; i < e.length; i++) {
      obj[e[i].enrol] = e[i];
    }
    return obj;
  })
  var newObj = Object.assign({}, ...megaFinalArray);
  console.log(newObj);

  fs.writeFile("./" + dest_file, JSON.stringify(newObj, null, 4), function(err) {
      if(err) {
          return console.log(err);
      }

      console.log("The file was saved!");
  });
  child_process.exec('rm -rf pdf_pages/');
}, 50000);
