var app = angular.module("myApp", []);

app.controller("myCtrl", function($scope) {

    $scope.student = {};
    $scope.submitted = false;

    $scope.submit = function() {
        $scope.submitted = true;
    };

});

// Custom Filter
app.filter("uppercaseText", function() {
    return function(text) {
        return text ? text.toUpperCase() : "";
    };
});

// Custom Directive
app.directive("highlight", function() {
    return {
        link: function(scope, element) {
            element.css("color", "blue");
        }
    };
});