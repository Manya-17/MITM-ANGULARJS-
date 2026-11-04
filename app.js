var app = angular.module('myApp', []);

//parent controller

app.controller('CollegeController', function($scope) {
    $scope.collegeName = "abc college";
});

//child controller

app.controller(
     "StudentController", function($scope) {
        $scope.name = "john";
        $scope.department = "Computer Science";
        $scope.semester = 3;

        //aray
        $scope.students =[
            "MANYA H A",
            "BHOOMIKA K ",
            "SADVI",
            "THANMAYA",
        ];
        $scope.USN =[
            107,
            108,
            109, 
            110,      
        ];
    }
);
    