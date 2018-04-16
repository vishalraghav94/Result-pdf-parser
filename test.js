var pdfreader = require('pdfreader');

var rows = {}; // indexed by y-position
var newArr = [];
var filename = 'Sample.pdf';
function printRows() {
  Object.keys(rows) // => array of y-positions (type: float)
    .sort((y1, y2) => parseFloat(y1) - parseFloat(y2)) // sort float positions
    .forEach(function(y) {
      newArr.push((rows[y] || []).join(','));
      console.log((rows[y] || []).join(','));
    });
    console.log(newArr);
    newArr.splice(0, 14);
    newArr.splice(newArr.length - 4, 4);
    console.log(newArr);
    var finalArray;
    if (newArr.length > 1) {
      newArr = getFormattedArray(newArr);
      finalArray = getMarksObject(newArr);
    }
    console.log(finalArray);

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
  console.log(marksString);
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
    return parseInt(ele.substring(0,ele.indexOf('(')));
  });
  console.log(marksString);
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

new pdfreader.PdfReader().parseFileItems(filename, function(err, item){
  if (!item || item.page) {
    // end of file, or page
    printRows();
    console.log('PAGE:', item.page);
    rows = {}; // clear rows for next page
  }
  else if (item.text) {
    // accumulate text items into rows object, per line
    (rows[item.y] = rows[item.y] || []).push(item.text);
  }
});
