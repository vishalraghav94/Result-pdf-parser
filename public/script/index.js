var result = angular.module('result', []);
result.controller('resultController', function($scope, $http) {
    var globalEnrol, globalSem;
    $scope.startIndex = [];
    $scope.endIndex = [];
    $scope.branch = 'IT';
    $scope.repositionFlag = true;
    $scope.minIndex = [];
    $scope.maxIndex = [];
    $scope.getMarks = function(enrol, sem, branch) {
        $scope.repositionFlag = false;
        sem = sem || 6;
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
                    $scope.studentsArray = res.data.data;
                    $scope.startIndex[0] = 0;
                    $scope.endIndex[0] = 10;
                    $scope.maxIndex[0] = $scope.studentsArray.length - 1;
                    $scope.minIndex[0] = 0;
                    $scope.students = $scope.studentsArray.slice($scope.startIndex[0], $scope.endIndex[0]);
                    marksCall(enrol, sem, branch);
                }
            });
        }
        else {
            marksCall(enrol, sem, branch);
        }

        scrollToY(0, 1200, 'easeOutSine');
       // window.scrollTo(0, 0);
    };




    $scope.next = function(index) {
        index = index || 0;
        if ($scope.endIndex[index] + 10 <= $scope.maxIndex[index])
        {
            $scope.startIndex[index] += 10;
            $scope.endIndex[index] += 10;
        }
        if (!index) {
            $scope.students = $scope.studentsArray.slice($scope.startIndex[0], $scope.endIndex[0]);
        }
        else {
            $scope.globalStudents = $scope.globalStudentsArray.slice($scope.startIndex[index], $scope.endIndex[index]);
        }
    };
    $scope.previous = function(index) {
        index = index || 0;
        if ($scope.startIndex[index] - 10 >= $scope.minIndex[index])
        {
            $scope.startIndex[index] -= 10;
            $scope.endIndex[index] -= 10;
        }
        if (!index) {
            $scope.students = $scope.studentsArray.slice($scope.startIndex[0], $scope.endIndex[0]);
        }
        else {
            $scope.globalStudents = $scope.globalStudentsArray.slice($scope.startIndex[index], $scope.endIndex[index]);
        }

    };
    $scope.returnToFirst = function(index) {
        index = index || 0;
        $scope.startIndex[index] = 0;
        $scope.endIndex[index] = 10;
        if (!index) {
            $scope.students = $scope.studentsArray.slice($scope.startIndex[0], $scope.endIndex[0]);
        }
        else {
            $scope.globalStudents = $scope.globalStudentsArray.slice($scope.startIndex[index], $scope.endIndex[index]);
        }

    };
    function marksCall(enrol, sem, branch) {
        $http.get('/marks?enrol=' + enrol + '&sem=' + sem + '&branch=' + branch).then(function(res) {
            if (res.data.error) {
               alert(res.data.error);
                marksCall(enrol, sem);
            } else {
                $scope.studentInfo = res.data.data;
                /*$scope.studentInfo.percent = $scope.studentInfo.totalMarks / 12;
                $scope.studentInfo.percent = Math.round($scope.studentInfo.percent*100)/100;*/
                var percentArray = $scope.studentInfo.allSemMarks;
                createGraph(percentArray);
            }
        })
    }

    window.onload = function() {
        $http.get('/globalRanks' ).then(function(res) {
            if (res.data.error) {
                this();
            }
             else {
                $scope.globalStudentsArray = res.data.data;
                $scope.startIndex[1] = 0;
                $scope.endIndex[1] = 10;
                $scope.maxIndex[1] = $scope.globalStudentsArray.length - 1;
                $scope.minIndex[1] = 0;
                $scope.globalStudents = $scope.globalStudentsArray.slice($scope.startIndex[1], $scope.endIndex[1]);
            }

        });
    };
    var myChart;
   function createGraph(data) {
       var ctx = document.getElementById("myChart").getContext('2d');
       var gradient = ctx.createLinearGradient(0, 100, 300, 0);
       gradient.addColorStop(0, '#EE7752');
       gradient.addColorStop(1, '#E73C7E');
       console.log(ctx);
       if (myChart) {
           myChart.destroy();
       }
       myChart = new Chart(ctx, {
           type: 'line',
           data: {
               labels: ["1st", "2nd", "3rd", "4th", "5th", "6th"],
               datasets: [{
                   label: 'Marks over Semesters',
                   data: data,//[74.4, 78, 80.9, 80.5, 83.5],
                   backgroundColor: gradient /*[
                       'linear-gradient(-45deg, #EE7752, #E73C7E, #23A6D5, #23D5AB)'//'rgba(0,229,255, 0.6)'
                   ]*/,
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

window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        function( callback ){
            window.setTimeout(callback, 1000 / 60);
        };
})();

// main function
function scrollToY(scrollTargetY, speed, easing) {
    // scrollTargetY: the target scrollY property of the window
    // speed: time in pixels per second
    // easing: easing equation to use

    var scrollY = window.scrollY,
        scrollTargetY = scrollTargetY || 0,
        speed = speed || 2000,
        easing = easing || 'easeOutSine',
        currentTime = 0;

    // min time .1, max time .8 seconds
    var time = Math.max(.1, Math.min(Math.abs(scrollY - scrollTargetY) / speed, .8));

    // easing equations from https://github.com/danro/easing-js/blob/master/easing.js
    var PI_D2 = Math.PI / 2,
        easingEquations = {
            easeOutSine: function (pos) {
                return Math.sin(pos * (Math.PI / 2));
            },
            easeInOutSine: function (pos) {
                return (-0.5 * (Math.cos(Math.PI * pos) - 1));
            },
            easeInOutQuint: function (pos) {
                if ((pos /= 0.5) < 1) {
                    return 0.5 * Math.pow(pos, 5);
                }
                return 0.5 * (Math.pow((pos - 2), 5) + 2);
            }
        };

    // add animation loop
    function tick() {
        currentTime += 1 / 60;

        var p = currentTime / time;
        var t = easingEquations[easing](p);

        if (p < 1) {
            requestAnimFrame(tick);

            window.scrollTo(0, scrollY + ((scrollTargetY - scrollY) * t));
        } else {
            console.log('scroll done');
            window.scrollTo(0, scrollTargetY);
        }
    }

    // call it once to get started
    tick();
}

// scroll it!

