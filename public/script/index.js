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
                       'rgba(255, 99, 132, 0.2)',
                       'rgba(54, 162, 235, 0.2)',
                       'rgba(255, 206, 86, 0.2)',
                       'rgba(75, 192, 192, 0.2)',
                       'rgba(153, 102, 255, 0.2)',
                       'rgba(255, 159, 64, 0.2)'
                   ],
                   borderColor: [
                       'rgba(255,99,132,1)',
                       'rgba(54, 162, 235, 1)',
                       'rgba(255, 206, 86, 1)',
                       'rgba(75, 192, 192, 1)',
                       'rgba(153, 102, 255, 1)',
                       'rgba(255, 159, 64, 1)'
                   ],
                   borderWidth: 1
               }]
           },
           options: {
               scales: {
                   yAxes: [{
                       ticks: {
                           beginAtZero:false
                       }
                   }]
               }
           }
       });
   }
});
