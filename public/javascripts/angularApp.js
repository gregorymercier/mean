var app = angular.module('flapperNews', ['ui.router','angularUtils.directives.dirPagination','angular-growl','ui-notification','ngMessages','angularFileUpload','toastr']);//,'ngAnimate', 'toastr']);

app.factory('patients', ['$http','growl','$state', function($http,growl,$state){
  var o = {
    patients: []
  };
  
	// get all patients
	o.getAll = function() {
		return $http.get('/patients').success(function(data){
			angular.copy(data, o.patients);
		});
	};
	// get patient
	o.get = function(id) {
		return $http.get('/patients/' + id).then(function(res){
			return res.data;
		});
	};
	// create patient
	o.create = function(patient) {
		return $http.post('/patients', patient).success(function(data){
			o.patients.push(data);
			//window.location='#/home';
			//growl.success("Patient créé ");
		});
	};
  
	//--WORKS with 	
	o.update = function(patient) {
		return $http.put('/patients/'+ patient._id, patient)
			.success(function(data){
				//.then(function(res){
				console.log("updated");
				o.patients.push(data);
			})
			.error(function(data){
				console.log("error "+data);
			});
		//--WORKS but no redirection
		//return $http.put('/posts', post)
		//.then(function(res){
		//	window.location='#/home';
		//	growl.success("<b>Patient mis à jour ");//, config);
		//});
	};
	//delete patient
	o.delete = function(patient){
		return $http.delete('/patients/'+ patient._id, patient)
			.success(function(data){
				console.log("patient deleted");
			})
			.error(function(data){
				console.log("error "+data);
			});
	};
	//upload file to patient
	o.uploadFile = function(patient, file) {
		var formData = new FormData();
		formData.append('file', file);
		console.log("FormData Constructor "+formData);
		return $http.post(
			'file', 
			formData, 
			{transformRequest: angular.identity,
			headers: {'Content-Type': undefined}
		}).success(function (data) {
		   console.log("upload done");
		}).error (function(data){
			console.log("upload failed");
		});
		//return $http.post('/patients/' + id + '/upload');
		//return $http.post('/file');
	};
    o.deleteFile = function(patient, file){
		//console.log(patient);//return $http.delete('/patients/'+patient._id+'/file/'+ file._id)
		return $http.delete('/patients/'+patient._id+'/file/'+ file._id, patient)
			.success(function(data){
				console.log("file deleted");
				//console.log(patient);
				//return $http.get('/patients/' + id).then(function(res){
				//	return res.data;
				//});
				
			})
			.error(function(data){
				console.log("error "+data);
			});
	}	

  return o;
}]);	
//Notify message
app.factory('AlertService', function () {
  var success = {},
      error = {},
      alert = false;
  return {
    getSuccess: function () {
      return success;
    },
    setSuccess: function (value) {
      success = value;
      alert = true;
    },
    getError: function () {
      return error;
    },
    setError: function (value) {
      error = value;
      alert = true;
    },
    reset: function () {
      success = {};
      error = {};
      alert = false;
    },
    hasAlert: function () {
      return alert;
    }
  }
});
app.factory('notificationFactory',function(toastr){
	var logIt;
    toastr.options = {
        "closeButton": true,
        "positionClass": "toast-bottom-right",
        "timeOut": "3000"
    };
    logIt = function (message, type) {
        return toastr[type](message);
    };
    return {
        success: function (message) {
            logIt(message, 'success');
        },
        error: function (message) {
            logIt(message, 'error');
        }
    };
});


app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

	$stateProvider
    .state('home', {
		url: '/home',
		templateUrl: 'templates/home.html',
		controller: 'MainCtrl',
		resolve: {
			postPromise: ['patients', function(patients){
			  return patients.getAll();
			}]
		}
    })
	.state('createPatient', {
		url: '/createPatient',
		templateUrl: 'templates/createPatient.html',
		controller: 'createPatientCtrl'
	})
	.state('createPatient-step1', {
		url: '/createPatient-step1',
		templateUrl: 'templates/createPatient-step1.html',
		//controller: 'createPatientCtrl'
	})
	.state('createPatient-step2', {
		url: '/createPatient-step2',
		templateUrl: 'templates/createPatient-step2.html',
		//controller: 'createPatientCtrl'
	})
	.state('updatePatient', {
		//url: '/patients/{id}/updatePatient',
		url: '/patients/:id/updatePatient',
		templateUrl: 'templates/updatePatient.html',
		controller: 'updatePatientCtrl',
		//params : ['id'],
		resolve: {
			patient: ['$stateParams', 'patients', function($stateParams, patients) {
			  return patients.get($stateParams.id);
			}]
		  }
		  
	})
	.state('file', {
		url: '/file',
		templateUrl: 'templates/file.html',
	})
	;

  $urlRouterProvider.otherwise('home');
}]);
//notification
app.config(['growlProvider', function (growlProvider) {
  growlProvider.globalTimeToLive(3000);
}]);
app.config(function(NotificationProvider) {
        NotificationProvider.setOptions({
            delay: 10000,
            startTop: 20,
            startRight: 10,
            verticalSpacing: 20,
            horizontalSpacing: 20,
            positionX: 'left',
            positionY: 'bottom'
        });
    });



// homepage - display all patients
app.controller('MainCtrl', [
'$scope',

'$filter',
'patients',
'AlertService',
'toastr',
function($scope,$filter, patients,AlertService,toastr){
	$scope.patients = $filter('filter')(patients.patients, $scope.query);
	//Add sort functionnality
	$scope.sort = function(keyname){
        $scope.sortKey = keyname;   //set the sortKey to the param passed
        $scope.reverse = !$scope.reverse; //if true make it false and vice versa
    }
	//Default items per Page
	$scope.sort('lastname');
	$scope.pageSize = 10;
	$scope.success = AlertService.getSuccess();
	//toastr.success('Demo');
	
}]);
// Patient Form
app.controller('createPatientCtrl', [
	'$scope',
	'$location',
	'$state'	,
	'$timeout',
	'patients',	
	'toastr',
function($scope, $location,$state, $timeout,patients,toastr){	
		$scope.createPatient = function(){
			if(!$scope.lastname || $scope.firstname === '') { return; }
			patients.create({
				lastname: $scope.lastname,
				firstname: $scope.firstname,
				email: $scope.email,
				phone: $scope.phone,
				phone2: $scope.phone2,
				address: $scope.address,
				zipcode: $scope.zipcode,
				city: $scope.city
			});
			//console.log("patient créé");
			toastr.success('Patient créé');
			$state.go('home');
		};
		
	}
]);
app.controller('updatePatientCtrl', [
	'$scope',
	'$state',
	'$stateParams',
	'patients',
	'patient',
	'toastr',
	'$timeout',
	'FileUploader',
	function($scope, $state, $stateParams, patients,patient,toastr,$timeout,FileUploader){//, toastr){	
		$scope.patient = patient;
		
		//DOESNT WORK
		//$scope.post = posts.get($stateParams.id);
		$scope.updatePatient=function(patient){
			//console.log('in update process');
			//console.log("update id : "+ patient._id);
			//console.log($stateParams.id);
			//posts.update({id: post._id}, $scope.post);
			patients.update(patient, {lastname: $scope.lastname,
								firstname: $scope.firstname});
			
			//console.log("updated");
			toastr.success('Patient mis à jour');
			$state.go('home');
		};
		$scope.deletePatient=function(patient){
			if(confirm('Voulez-vous vraiement supprimer ce patient ?')){
				patients.delete(patient);
				$state.go('home');
			}
		};
		// file upload
		var uploader = $scope.uploader = new FileUploader();
		var uploadURL = '/upload/'+patient._id;
		//console.log(uploadURL);
		$scope.uploadOptions = {
			queueLimit: 1,
			//autoUpload: true,
			url: uploadURL,
			removeAfterUpload: true //avoid to upload the same file several times 
		}
 
		$scope.uploadFile = function(patient){
			console.log(patient);
			if (!$scope.uploader.queue[0]) return;
			$scope.uploader.queue[0].upload(); 
			//$scope.uploader.queue
			console.log('Upload File');
			//console.log(patient._id);
			/*patients.get(patient._id).then(function(patient){
				$scope.patient = patient;
			});*/
			
        };
		
		uploader.onCompleteItem = function(fileItem, response, status, headers) {
            //console.info('onCompleteItem', fileItem, response, status, headers);
			patients.get(response._id).then(function(patient){
				$scope.patient = patient;
			});
			//hack 
			document.getElementById('patientFileUpload').value = null;
			toastr.success('Fichier ajouté.');
        };
			
		
		$scope.deleteFile = function(patient,file){
			if(confirm('Voulez-vous vraiement supprimer ce fichier ?')){
				//console.log(patient);
				patients.deleteFile(patient, file);
				//refresh scope after patient file deletion  
				patients.get(patient._id).then(function(patient){
					$scope.patient = patient;
				});
				toastr.success('Fichier supprimé.');
			}
		}		
	}	
]);
