
const app = angular.module("CalApp", ["ngMaterial", "materialCalendar"]);
const ctrl = app.controller("CalAppCtrl", CalAppCtrl);

function CalAppCtrl($scope, $filter, $http, $q, $mdDialog) {
    this.$inject = ['$scope', '$filter', '$http', '$q', '$mdDialog'];
    $scope.appointments = [ ];
    $scope.dates = {};
    fetchAppointments($scope.appointments, $scope.dates);

    $scope.tooltips = true;
    $scope.dayFormat = "dd";
    $scope.selectedDate = null;
    $scope.firstDayOfWeek = 0; // sunday

    $scope.currDay = currDay;
    $scope.prevMonth = prevMonth;
    $scope.nextMonth = nextMonth;
    $scope.setDirection = setDirection;
    $scope.setDayContent = setDayContent;

    // note: afterwards, functions only

    function fetchAppointments(appointments, dates) {
        const data = $http.get("http://localhost:3001/appointments");
        const ok = (result) => {
            const app_list = result.data.map((app_item) => (app_item));
            appointments.push(app_list);
            result.data.forEach((app_item) => {
                dates[app_item.date] = dates[app_item.date] || [];
            });
            // const $scope.msg = "You clicked " + $filter("date")(date, "y, m, d, h:mm:ss a Z");            
        };
        const no = (fail) => {
            console.log({ fail });
        };
        data.then(ok, no);
    }
    
    function setDayContent(date) {
        console.log("set day content", date, $scope.appointments);
        if ($scope.appointments.includes(date)) {
            console.log("set day content", date, "included!!!!!!");
        }

        return "<p>" + date + "</p>";
        return $http.get("/some/external/api");
        var deferred = $q.defer();
        $timeout(function() {
            deferred.resolve("<p></p>");
        }, 1000);
        return deferred.promise;
    };
    
    function setDirection(direction) {
        $scope.direction = direction;
        $scope.dayFormat = direction === "vertical" ? "EEEE, MMMM d" : "d";
    };

    function currDay(date) {
        $scope.msg = "currDay, You clicked " + $filter("date")(date, "MMM d, y h:mm:ss a Z");
        console.log({ msg : $scope.msg, apps : $scope.appointments, date : date } );
        $scope.selectedDate = date;
    };

    function prevMonth(data) {
        $scope.msg = "You clicked (prev) month " + data.month + ", " + data.year;
        console.log($scope.msg);
    };

    function nextMonth(data) {
        $scope.msg = "You clicked (next) month " + data.month + ", " + data.year;
        console.log($scope.msg);
    };
}


