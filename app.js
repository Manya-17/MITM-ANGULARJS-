/* 
  Full Name: [Your Full Name Here]
  Department: [Your Department Here]
*/

var app = angular.module('studentApp', []);

// Parent Controller
app.controller('CollegeController', function($scope) {
    $scope.collegeName = "Maharaja Institute Of Technology";
});

// Child Controller
app.controller('StudentController', function($scope) {
    // Initial sample array containing at least three student names
    $scope.students = ["MANYA", "SADVI", "BHOOMIKA K C"];

    // Initial visibility state for Show/Hide Details (set to false so it's hidden initially)
    $scope.showDetails = false;

    // Function to toggle visibility
    $scope.toggleDetails = function() {
        $scope.showDetails = !$scope.showDetails;
    };

    // Function to add a student name to the list and clear the input field
    $scope.addStudent = function() {
        if ($scope.studentName && $scope.studentName.trim() !== "") {
            $scope.students.push($scope.studentName);
            // Clear the name input field after adding
            $scope.studentName = ""; 
        } else {
            alert("Please enter a valid student name before adding.");
        }
    };
});