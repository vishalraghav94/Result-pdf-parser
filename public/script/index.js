var result = angular.module('result', []);
result.controller('resultController', function($scope, $http) {
    $scope.getMarks = function(enrol) {
        $http.get('/marks?enrol=' + enrol).then(function(res) {
            $scope.studentInfo = res.data.data;
            $scope.studentInfo.percent = $scope.studentInfo.totalMarks / 12;
            $scope.studentInfo.percent = Math.round($scope.studentInfo.percent*100)/100;
        })
    }
});
