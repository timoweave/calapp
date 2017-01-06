
angular
    .module("CalApp", ["ngResource", "ui.router", "ngMaterial", "materialCalendar"])
    .constant("url", "http://localhost:3001/appointments")
    .factory("CalAppAppointment", CalAppAppointment)
    .controller("CalAppCalendar", CalAppCalendar)
    .controller("CalAppEditor", CalAppEditor)
    .config(CalAppConfigRoute)
    .config(CalAppConfigTheme)
;

function CalAppConfigTheme($mdThemingProvider) {
    this.$inject = [ '$mdThemingProvider'];
    $mdThemingProvider.theme('default')
        .primaryPalette('pink')
        .accentPalette('orange');
}

function CalAppConfigRoute($stateProvider, $urlRouterProvider, url) {

    this.$inject = [ '$stateProvider', '$urlRouterProvider', 'url' ];

    $stateProvider
        .state('calendar', {
            url : '/',
            controller : 'CalAppCalendar',
            templateUrl : 'cal.html',
            params : getYYMMDD(),
            resolve : { appointments : appointmentResource }
        })
        .state('month', {
            url : '/:year/:month',
            controller : 'CalAppCalendar',
            templateUrl : 'cal.html',
            params : getYYMMDD(),
            resolve : { appointments : appointmentResource }
        })
        .state('date', {
            url : '/:year/:month/:date',
            controller : 'CalAppCalendar',
            templateUrl : 'cal.html',
            params : getYYMMDD(),
            resolve : { appointments : appointmentResource }
        })
        .state('calendar.edit', {
            parent : 'calendar',            
            url : '/edit/:year/:month/:date',
            controller: 'CalAppEditor',
            templateUrl : 'edit.html',            
            params : getYYMMDD()
        })
    ;

    $urlRouterProvider.otherwise('/');

    // note : functions only

    function appointmentResource($http, url) {

        this.$inject = ['$http', 'url' ];
        
        const get_list = $http.get(url).then((resp) => {
            const map_list = resp.data.map((d) => {
                let data = d;
                data.year = parseInt(d.year);
                data.date = parseInt(d.date);
                return data;
            });
            return map_list;
        });
        return get_list;
    }
}

function CalAppEditor($scope, $mdDialog, parentScope, $http, url) {

    this.$inject = [ '$scope', '$mdDialog', 'parentScope', '$http', 'url' ];
    $scope.parentScope = parentScope;
    $scope.appointments = parentScope.appointments;
    $scope.selectedDate = parentScope.selectedDate;
    $scope.selectedAppointments = parentScope.selectedAppointments;
    $scope.new = undefined;
    const [ week, month, dd, yy ] = parentScope.selectedDate.toString().split(" ");
    $scope.selectedDateTitle = [dd, month, yy].join(" ");

    $scope.hide = function() {
        $mdDialog.hide();
    };
    
    $scope.cancel = function() {
        $mdDialog.cancel();
    };
    
    $scope.save = function() {
        console.log($scope.parentScope);
        if ($scope.new === undefined) {
            $mdDialog.hide("save");
            return;
        }
        $http.post(url, $scope.new).then((resp) => {
            const item = $scope.new;
            item.date = parseInt(item.date);
            item.year = parseInt(item.year);
            $scope.selectedAppointments.push(item);
            $scope.appointments.push(item);                
            // console.log("save data", $scope.new, resp);
            $scope.new = undefined;
            $mdDialog.hide("save");
            debugger;
        });
    };
}

function CalAppCalendar($scope, $stateParams, $location, $filter, $mdDialog,
                        url, appointments) {

    this.$inject = [ '$scope', '$stateParams', '$location', '$filter', '$mdDialog',
                     'url', 'appointments'];
    init($scope);

    
    // note: afterwards, functions only

    function init($scope) {
        initDate($scope, $stateParams);
        initCalendar($scope);
        initDialog($scope);
        initAPI($scope);
    }
    
    function initDialog($scope) {
        $scope.customFullscreen = false;
        $scope.edit = function(ev) {
            $mdDialog
                .show({
                    controller: CalAppEditor,
                    templateUrl: 'edit.html',
                    targetEvent: ev,
                    locals: {
                        parentScope : $scope
                    },
                    clickOutsideToClose:true,
                    fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
                })
                .then(function(answer) {
                    $scope.status = 'You said the information was "' + answer + '".';
                    debugger;
                }, function() {
                    $scope.status = 'You cancelled the dialog.';
                });
        };
    }
    
    function initAPI($scope) {
        $scope.add = addAppointment($scope, CalAppCalendar, url);
    }
    
    function initDate($scope, $stateParams) {
        $scope.year = $stateParams.year;
        $scope.month = $stateParams.month;
        $scope.date = $stateParams.date;
        $scope.appointments = appointments;
    }
    
    function initCalendar($scope) {
        $scope.tooltips = true;
        $scope.dayFormat = "dd";
        $scope.selectedDate = null;
        $scope.firstDayOfWeek = 0; // sunday
        
        $scope.clickDay = clickDay;
        $scope.prevMonth = prevMonth;
        $scope.nextMonth = nextMonth;
        $scope.setDirection = setDirection;
        $scope.setDayContent = setDayContent;
    }

    function setDayContent(todate) {
        return onDay(todate, function(err, result) {
            if (err) {
                return "<br/><br/><br/><br/>";                
            } else {
                return result.map((a, i) => {
                    const title = a.title.slice(0, 15);
                    return `<span >${i}. ${title}...</span>`;
                }).join("<br/>");
            }
        });
    }

    function setDirection(direction) {
        $scope.direction = direction;
        $scope.dayFormat = direction === "vertical" ? "EEEE, MMMM d" : "d";
    };

    function clickDay(todate) {
        return onDay(todate, function(err, appointments) {
            $scope.selectedDate = todate;
            if (err) {
                $scope.selectedAppointments = [];
                $scope.edit();
                return;
            } else {
                $scope.selectedAppointments = appointments;
                $scope.edit();;
                return;
            }
        });
    };

    function onDay(todate, callback) {
        const [ week, month, dd, yy ] = todate.toString().split(" ");
        const date = parseInt(dd);
        const year = parseInt(yy);
        const appointments = $scope.appointments;
        const filtered_appointments = getAppointment(appointments, year, month, date);
        if (filtered_appointments.length > 0) {
            return callback(null, filtered_appointments);
        } else {
            return callback(true, []);
        }
    }
    
    function prevMonth(data) {
        $scope.msg = "You clicked (prev) month " + data.month + ", " + data.year;
        $scope.year = data.year;
        $scope.month = data.month - 1;
        console.log($scope.msg, data, $scope.month, $scope.year);
    };

    function nextMonth(data) {
        $scope.msg = "You clicked (next) month " + data.month + ", " + data.year;
        $scope.year = data.year;
        $scope.month = data.month - 1;
        console.log($scope.msg, data, $scope.month, $scope.year);
    };
}

function CalAppAppointment($resource, $stateParams, url) {
    this.$inject = [ '$resource', '$stateParams', 'url' ];
    // const year = $stateParams.year;
    // const month = convertNumToMonth($stateParams.month);
    return $resource(url,
                     { id : "@id"},
                     { update: { method: "PUT" },
                       fetch: { method: "GET",
                                interceptor : {
                                    response: function(data) { return data; },
                                    responseError : function(data) { return []; }
                                },
                                isArray: true
                              }
                     }
                    );
}

function addAppointment($scope, CalAppAppointment, url) {
    
    return function(data, callback) {
        const [ week, month, date, year ] = data.date.toString().split(" ");
        if (hasAppointment($scope.appointments, year, month, date)) {
            return $resource(url, {id : "@id"}, {update: { method: "PUT" } } ).post(data);
            callback(null, data);
        } else {            
            return callback(!ok, null);
        }
        
        $scope.appointments.filter((a) => {
            return true;
        });
        const k = {
            "id": "0",
            "title": "dental decorate",
            "desc": "deep cleaning",
            "year": "2016",
            "month" : "Dec",
            "date": "30",
            "begin": "08:00",
            "end": "09:00"
        };
    };
}

function getYYMMDD() {
    const now = new Date();
    return {
        year: now.getFullYear(),
        month: now.getMonth(),
        date: now.getDate()
    };
}

function hasAppointment(appointments, year, month, date) {
    const filtered_apps = getAppointment(appointments, year, month, date);
    return (filtered_apps.length > 0);
}

function getAppointment(appointments, year, month, date) {
    const filtered_apps = appointments.filter((a) => {
        if ((a.year === year) && (a.month === month) && (a.date === date)) {
            return true;
        }
        return false;
    });
    return filtered_apps;
}

function convertNumToMonth(m) {
    const months = { "0" : "Jan", "1" : "Feb", "2" : "Mar", "3" : "Apr",
                     "4" : "May", "5" : "Jun", "6" : "Jul", "7" : "Aug",
                     "8" : "Sep", "9" : "Oct", "10" : "Nov", "11" : "Dec" };
    return months[m];
}

function convertMonthToNum (m) {
    const months = { "Jan" : 0, "Feb" : 1, "Mar" : 2, "Apr" : 3,
                     "May" : 4, "Jun" : 5, "Jul" : 6, "Aug" : 7,
                     "Sep" : 8, "Oct" : 9, "Nov" : 10, "Dec" : 11 };
    return months[m];
};


class Appointment {
    
    constructor({title, desc, begin, end, date, month, year}) {
        this.title = title;
        this.desc = desc;
        this.begin = begin;
        this.end = end;
        this.date = parseInt(date);
        this.month = convertMonthToNum(month);
        this.year = parseInt(year);
        this.begin_min = Appointment.convert_min(begin);
        this.end_min = Appointment.convert_min(end);
    }
    
    print() {
        console.log({y : this.year, m : this.month, d: this.date,
                     b: this.begin_min, e : this.end_min});
    }

    has_overlap({begin_min, end_min, date, month, year}) {
        if (year !== this.year) { return false; }
        if (month !== this.month) { return false; }
        if (date !== this.date) { return false; }
        
        if (this.end_min > begin_min) { return true; }
        if (end_min < this.begin_min) { return true; }
        return false;
    }

    static convert_min(time_string) {
        const time_list = time_string.split(":").map((a) => (parseInt(a)));
        const mins = time_list
              .slice(0, -1)
              .reduce((t, i) => {return (t + i * 60);}, 0);
        return mins + + time_list.slice(-1)[0];
    }
    
    static overlap_time(earlier, later) {
        const earlier_min = Appointment.convert_min(earlier);
        const later_min = Appointment.convert_min(later);
        return earlier_min > later_min;
    }
   
    static sort_ascend(lhs, rhs) {
        if (lhs.year < rhs.year) { return lhs.year - rhs.year; }
        if (lhs.month < rhs.month) { return lhs.month - rhs.moth; }
        if (lhs.date < rhs.date) { return lhs.date - rhs.date; }
        if (lhs.begin < rhs.begin) { return lhs.begin - rhs.begin; }
        return lhs.end - rhs.end;
    }
    
}

class AppointmentManager {
    
    constructor() {
        this.appointments = [];
    }

    print() {
        this.appointments.forEach((a) => {
            a.print();
        });
    }
    
    push(app) {
        const any_overlapped = this.appointments.reduce((ans, app_i) => {
            return ((ans) || (app.has_overlap(app_i)));
        }, false);
        if (!any_overlapped) {
            this.appointments.push(app);
        }
    }

    sort() {
        const sorted_apps = this.appointments.sort(Appointment.sort_ascend);
        this.appointments = sorted_apps;
    }
}

let a = new Appointment({
    title: "hello", desc : "say something",
    begin : "00:00", end : "01:00",
    date : 1, month : "Dec", year : "2016"
});

let b = new Appointment({
    title: "bad", desc : "dont do this overlapped appointment",
    begin : "00:59", end : "03:00",
    date: 1, month : "Dec", year : 2016
});

let c = new Appointment({
    title: "hey", desc : "what's up",
    begin : "01:01", end : "03:00",
    date: 1, month : "Dec", year : 2016
});


let m = new AppointmentManager();
m.push(c);
m.push(b);
m.push(a);
