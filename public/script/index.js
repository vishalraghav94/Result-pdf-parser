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
        })
    }
});
