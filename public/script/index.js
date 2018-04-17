var result = angular.module('result', []);
result.controller('resultController', function($scope, $http) {
    $scope.getMarks = function(enrol) {
        $http.get('/marks?enrol=' + enrol).then(function(res) {
            var marks = res.data.data;
            $scope.marks = marks.marks;
            $scope.name = marks.name;
            $scope.enrol = marks.enrol;
        })
    }
});
