
var app = angular.module("ClinicApp", ["ngRoute"]);

// ======================================
// ROUTING CONFIGURATION
// ======================================

app.config(function($routeProvider) {
    $routeProvider
        .when("/dashboard", {
            templateUrl: "views/dashboard.html",
            controller: "DashboardController"
        })
        .when("/reception", {
            templateUrl: "views/reception.html",
            controller: "ReceptionController"
        })
        .when("/queue", {
            templateUrl: "views/queue.html",
            controller: "QueueController"
        })
        .when("/doctor", {
            templateUrl: "views/doctor.html",
            controller: "DoctorController"
        })
        .when("/billing", {
            templateUrl: "views/billing.html",
            controller: "BillingController"
        })
        .when("/history", {
            templateUrl: "views/history.html",
            controller: "HistoryController"
        })
        .when("/reports", {
            templateUrl: "views/reports.html",
            controller: "ReportsController"
        })
        .otherwise({
            redirectTo: "/dashboard"
        });
});

// ======================================
// SHARED CLINIC DATA SERVICE
// ======================================

app.factory("ClinicService", function($window) {

    var patients = JSON.parse(
        $window.localStorage.getItem("clinicPatients") || "[]"
    );

    var prescriptions = JSON.parse(
        $window.localStorage.getItem("clinicPrescriptions") || "[]"
    );

    var invoices = JSON.parse(
        $window.localStorage.getItem("clinicInvoices") || "[]"
    );

    var selectedPatient = null;
    var selectedPrescription = null;

    function save() {
        $window.localStorage.setItem(
            "clinicPatients", JSON.stringify(patients)
        );

        $window.localStorage.setItem(
            "clinicPrescriptions", JSON.stringify(prescriptions)
        );

        $window.localStorage.setItem(
            "clinicInvoices", JSON.stringify(invoices)
        );
    }

    function today() {
        var d = new Date();
        return d.getFullYear() + "-" +
            String(d.getMonth() + 1).padStart(2, "0") + "-" +
            String(d.getDate()).padStart(2, "0");
    }

    return {

        patients: patients,
        prescriptions: prescriptions,
        invoices: invoices,

        today: today,

        // PATIENT REGISTRATION
        registerPatient: function(data) {

            var mrn = "MRN-" + Date.now();

            var count = patients.filter(function(p) {
                return p.date === today() &&
                    p.doctor === data.doctor;
            }).length + 1;

            var patient = {
                id: mrn,
                mrn: mrn,
                name: data.name,
                phone: data.phone,
                age: data.age,
                gender: data.gender,
                doctor: data.doctor,
                token: "T-" + String(count).padStart(3, "0"),
                date: today(),
                status: "Waiting",
                symptoms: "",
                diagnosis: "",
                history: "",
                vitals: {}
            };

            patients.push(patient);
            save();

            return patient;
        },

        // GET WAITING PATIENTS
        getWaitingPatients: function() {
            return patients.filter(function(p) {
                return p.date === today() &&
                    p.status === "Waiting";
            });
        },

        // GET PATIENT
        getPatient: function(id) {
            return patients.find(function(p) {
                return p.id === id;
            });
        },

        // SHARE SELECTED PATIENT
        setSelectedPatient: function(patient) {
            selectedPatient = patient;
        },

        getSelectedPatient: function() {
            return selectedPatient;
        },

        // SAVE CONSULTATION
        saveConsultation: function(data) {

            var patient = this.getPatient(data.patientId);

            if (!patient) return false;

            patient.vitals = {
                bp: data.bp,
                pulse: data.pulse
            };

            patient.symptoms = data.symptoms;
            patient.history = data.history;
            patient.diagnosis = data.diagnosis;
            patient.status = "Consulted";
            patient.consulted = true;

            var existing = prescriptions.find(function(p) {
                return p.patientId === patient.id &&
                    p.status === "Pending";
            });

            if (existing) {
                existing.medicines = angular.copy(data.medicines);
                existing.diagnosis = data.diagnosis;
            } else {
                prescriptions.push({
                    id: "RX-" + Date.now(),
                    patientId: patient.id,
                    doctor: patient.doctor,
                    diagnosis: data.diagnosis,
                    medicines: angular.copy(data.medicines),
                    date: today(),
                    status: "Pending"
                });
            }

            save();
            return true;
        },

        // SELECT PRESCRIPTION
        setSelectedPrescription: function(prescription) {
            selectedPrescription = prescription;
        },

        getSelectedPrescription: function() {
            return selectedPrescription;
        },

        // COMPLETE BILLING
        completeBilling: function(prescriptionId, method) {

            var prescription = prescriptions.find(function(p) {
                return p.id === prescriptionId;
            });

            if (!prescription ||
                prescription.status !== "Pending") {
                return false;
            }

            var total = prescription.medicines.reduce(function(sum, m) {
                return sum + Number(m.price || 0);
            }, 0);

            invoices.push({
                id: "INV-" + Date.now(),
                patientId: prescription.patientId,
                prescriptionId: prescription.id,
                total: total,
                paymentMethod: method,
                date: today(),
                status: "Paid"
            });

            prescription.status = "Dispensed";

            var patient = this.getPatient(prescription.patientId);

            if (patient) {
                patient.status = "Completed";
            }

            save();
            return true;
        },

        // SEARCH PATIENT HISTORY
        searchPatient: function(query) {
            query = String(query || "").trim().toLowerCase();

            return patients.filter(function(p) {
                return p.mrn.toLowerCase() === query ||
                    p.phone.toLowerCase().includes(query);
            });
        },

        // DAILY REVENUE
        getDailyRevenue: function() {
            return invoices
                .filter(function(i) {
                    return i.date === today() &&
                        i.status === "Paid";
                })
                .reduce(function(sum, i) {
                    return sum + Number(i.total);
                }, 0);
        },

        save: save
    };
});

// ======================================
// DASHBOARD CONTROLLER
// ======================================

app.controller("DashboardController", function($scope, ClinicService) {

    function loadDashboard() {

        var todayPatients = ClinicService.patients.filter(function(p) {
            return p.date === ClinicService.today();
        });

        $scope.totalPatients = todayPatients.length;

        $scope.waitingPatients = todayPatients.filter(function(p) {
            return p.status === "Waiting";
        }).length;

        $scope.consultedPatients = todayPatients.filter(function(p) {
            return p.consulted;
        }).length;

        $scope.revenue = ClinicService.getDailyRevenue();

        $scope.recentPatients = todayPatients.slice(-5).reverse();
    }

    loadDashboard();
});

// ======================================
// RECEPTION CONTROLLER
// ======================================

app.controller("ReceptionController", function($scope, ClinicService) {

    $scope.patient = {
        name: "",
        phone: "",
        age: "",
        gender: "",
        doctor: "Dr. A. Rao"
    };

    $scope.register = function() {

        if (!$scope.patient.name ||
            !$scope.patient.phone ||
            !$scope.patient.age ||
            !$scope.patient.gender) {
            alert("Please fill all required fields.");
            return;
        }

        if (!/^\+?[0-9\s-]{7,15}$/.test($scope.patient.phone)) {
            alert("Enter a valid phone number.");
            return;
        }

        $scope.newPatient = ClinicService.registerPatient(
            angular.copy($scope.patient)
        );

        $scope.patient = {
            name: "",
            phone: "",
            age: "",
            gender: "",
            doctor: "Dr. A. Rao"
        };

        alert("Patient registered! Token: " +
            $scope.newPatient.token);
    };
});

// ======================================
// QUEUE CONTROLLER
// ======================================

app.controller("QueueController", function($scope, ClinicService) {

    $scope.loadQueue = function() {
        $scope.queue = ClinicService.getWaitingPatients();
    };

    $scope.callNext = function(patient) {

        ClinicService.setSelectedPatient(patient);

        window.location.hash = "#!/doctor";
    };

    $scope.loadQueue();
});

// ======================================
// DOCTOR CONTROLLER
// ======================================

app.controller("DoctorController", function($scope, ClinicService) {

    $scope.queue = ClinicService.getWaitingPatients();

    $scope.consultation = {
        medicines: []
    };

    $scope.selectPatient = function(patient) {

        ClinicService.setSelectedPatient(patient);

        $scope.selectedPatient = patient;

        $scope.consultation = {
            patientId: patient.id,
            bp: patient.vitals.bp || "",
            pulse: patient.vitals.pulse || "",
            symptoms: patient.symptoms || "",
            history: patient.history || "",
            diagnosis: patient.diagnosis || "",
            medicines: []
        };
    };

    var selected = ClinicService.getSelectedPatient();

    if (selected && selected.status === "Waiting") {
        $scope.selectPatient(selected);
    }

    $scope.addMedicine = function() {
        $scope.consultation.medicines.push({
            name: "",
            dosage: "",
            days: 1,
            price: 0,
            instructions: ""
        });
    };

    $scope.removeMedicine = function(index) {
        $scope.consultation.medicines.splice(index, 1);
    };

    $scope.saveConsultation = function() {

        if (!$scope.consultation.patientId) {
            alert("Select a patient first.");
            return;
        }

        if (!$scope.consultation.diagnosis ||
            !$scope.consultation.medicines.length) {
            alert("Enter diagnosis and add medicines.");
            return;
        }

        var valid = $scope.consultation.medicines.every(function(m) {
            return m.name && m.dosage &&
                Number(m.days) > 0 &&
                Number.isFinite(Number(m.price)) &&
                Number(m.price) >= 0;
        });

        if (!valid) {
            alert("Please check medicine details.");
            return;
        }

        if (ClinicService.saveConsultation(
            $scope.consultation
        )) {
            alert("Consultation saved successfully!");

            $scope.queue = ClinicService.getWaitingPatients();
            $scope.selectedPatient = null;
            $scope.consultation = { medicines: [] };

            ClinicService.setSelectedPatient(null);
        }
    };

    $scope.addMedicine();
});

// ======================================
// BILLING CONTROLLER
// ======================================

app.controller("BillingController", function($scope, ClinicService) {

    $scope.loadPrescriptions = function() {
        $scope.pendingPrescriptions =
            ClinicService.prescriptions.filter(function(p) {
                return p.status === "Pending";
            });
    };

    $scope.selectPrescription = function(prescription) {

        $scope.selectedPrescription = prescription;

        ClinicService.setSelectedPrescription(prescription);

        $scope.patient = ClinicService.getPatient(
            prescription.patientId
        );

        $scope.total = prescription.medicines.reduce(function(sum, m) {
            return sum + Number(m.price || 0);
        }, 0);

        $scope.paymentMethod = "Cash";
    };

    $scope.completePayment = function() {

        if (!$scope.selectedPrescription) return;

        var success = ClinicService.completeBilling(
            $scope.selectedPrescription.id,
            $scope.paymentMethod
        );

        if (success) {
            alert("Payment completed successfully!");

            $scope.selectedPrescription = null;
            $scope.patient = null;
            $scope.loadPrescriptions();
        } else {
            alert("Prescription unavailable or already processed.");
        }
    };

    $scope.loadPrescriptions();
});

// ======================================
// PATIENT HISTORY CONTROLLER
// ======================================

app.controller("HistoryController", function($scope, ClinicService) {

    $scope.search = "";

    $scope.searchPatient = function() {

        $scope.results = ClinicService.searchPatient(
            $scope.search
        );

        if (!$scope.results.length) {
            alert("No patient found.");
        }
    };

    $scope.getPrescriptions = function(patientId) {
        return ClinicService.prescriptions.filter(function(p) {
            return p.patientId === patientId;
        });
    };
});

// ======================================
// REPORTS CONTROLLER
// ======================================

app.controller("ReportsController", function($scope, ClinicService) {

    var today = ClinicService.today();

    $scope.totalTokens = ClinicService.patients.filter(function(p) {
        return p.date === today;
    }).length;

    $scope.consultations = ClinicService.patients.filter(function(p) {
        return p.date === today && p.consulted;
    }).length;

    $scope.revenue = ClinicService.getDailyRevenue();

    $scope.invoices = ClinicService.invoices.filter(function(i) {
        return i.date === today;
    });
});
