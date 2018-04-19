var result = angular.module('result', []);
result.controller('resultController', function($scope, $http) {
    var globalEnrol;
    $scope.getMarks = function(enrol) {
        var currentEnrol = enrol.substr(enrol.length - 8, enrol.length - 1);
        var flag = false;
        if (!globalEnrol || (currentEnrol !== globalEnrol)) {
            globalEnrol = currentEnrol;
            flag = true;
        }
        if (flag) {
            $http.get('/ranks?enrol=' + currentEnrol).then(function(res) {
                $scope.students = res.data.data;
                marksCall(enrol);
            });
        }
        else {
            marksCall(enrol);
        }
    };
    function marksCall(enrol) {
        $http.get('/marks?enrol=' + enrol).then(function(res) {
            $scope.studentInfo = res.data.data;
            /*$scope.studentInfo.percent = $scope.studentInfo.totalMarks / 12;
            $scope.studentInfo.percent = Math.round($scope.studentInfo.percent*100)/100;*/
        })
    }
});
