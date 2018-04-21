var result = angular.module('result', []);
result.controller('resultController', function($scope, $http) {
    var globalEnrol, globalSem;
    $scope.getMarks = function(enrol, sem) {
        sem = sem || 5;
        var currentEnrol = enrol.substr(enrol.length - 8, enrol.length - 1);
        var flag = false;
        if (!globalEnrol || (currentEnrol !== globalEnrol)) {
            globalEnrol = currentEnrol;
            flag = true;
        }
        if (!globalSem || (sem !== globalEnrol)) {
            globalSem = sem;
            flag = true;
        }
        if (flag) {
            $http.get('/ranks?enrol=' + currentEnrol + '&sem=' + sem).then(function(res) {
                if (res.data.error) {
                    alert(res.data.error);
                }
                else {
                    $scope.students = res.data.data;
                    marksCall(enrol, sem);
                }
            });
        }
        else {
            marksCall(enrol, sem);
        }

    };
    function marksCall(enrol, sem) {
        $http.get('/marks?enrol=' + enrol + '&sem=' + sem).then(function(res) {
            $scope.studentInfo = res.data.data;
            /*$scope.studentInfo.percent = $scope.studentInfo.totalMarks / 12;
            $scope.studentInfo.percent = Math.round($scope.studentInfo.percent*100)/100;*/
            var percentArray = $scope.studentInfo.allSemMarks;
            createGraph(percentArray);
        })
    }
   function createGraph(data) {
       var ctx = document.getElementById("myChart").getContext('2d');
       console.log(ctx);
       var myChart = new Chart(ctx, {
           type: 'line',
           data: {
               labels: ["1st", "2nd", "3rd", "4th", "5th", "6th"],
               datasets: [{
                   label: 'Marks over Semesters',
                   data: data,//[74.4, 78, 80.9, 80.5, 83.5],
                   backgroundColor: [
                       'rgba(0,229,255, 0.6)'
                   ],
                   borderColor: [
                       '#212121'
                   ],
                   borderWidth: 3
               }]
           },
           options: {
               scales: {
                   yAxes: [{
                       ticks: {
                           beginAtZero:false
                       },
                       scaleLabel: {
                           display: true,
                           labelString: 'Marks'
                       }
                   }],
                   xAxes: [{
                       scaleLabel: {
                           display: true,
                           labelString: 'Semester'
                       }
                   }]
               }
           }
       });
   }
});
