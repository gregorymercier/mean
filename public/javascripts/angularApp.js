var app = angular.module('flapperNews', ['ui.router','angularUtils.directives.dirPagination','angular-growl','ui-notification','ngMessages','angularFileUpload']);//,'ngAnimate', 'toastr']);

app.factory('patients', ['$http','growl', function($http,growl){
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
				console.log("deleted");
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
	.state('updatePatient', {
		url: '/patients/{id}/updatePatient',
		templateUrl: 'templates/updatePatient.html',
		controller: 'updatePatientCtrl',
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
function($scope,$filter, patients,AlertService){
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
	
}]);
// Patient Form
app.controller('createPatientCtrl', [
	'$scope',
	'$location',
	'$state'	,
	'$timeout',
	'patients',	
	'AlertService',
	function($scope, $location,$state, $timeout,patients,AlertService){	
		$scope.createPatient = function(){
			if(!$scope.lastname || $scope.firstname === '') { return; }
			patients.create({
				lastname: $scope.lastname,
				firstname: $scope.firstname
			});
			console.log("patient créé");
			//AlertService.setSuccess({ show: true, msg: $scope.lastname + ' has been updated successfully.' });
			//$location.path("#/home");
			$state.go('home');
			$scope.alert = {
				type: 'success',
				message: 'patient créé'
			};
			$timeout(function() {
				$scope.alert = undefined;
 
			}, 3000);
			//window.location='#/home';
			//growl.success("Patient créé ");
			//Notification.success('Success notification');
		};
		
	}
]);
app.controller('updatePatientCtrl', [
	'$scope',
	'$state',
	'$stateParams',
	'patients',
	'patient',
	//'toastr',
	'$timeout',
	'$upload',
	function($scope, $state, $stateParams, patients,patient,$timeout,$upload){//,toastr){	
		$scope.patient = patient;
		
		//DOESNT WORK
		//$scope.post = posts.get($stateParams.id);
		$scope.updatePatient=function(patient){
			console.log('in update process');
			console.log("update id : "+ patient._id);
			console.log($stateParams.id);
			//posts.update({id: post._id}, $scope.post);
			patients.update(patient, {lastname: $scope.lastname,
								firstname: $scope.firstname});
			
			//console.log("updated");
			$state.go('home');
		};
		$scope.deletePatient=function(patient){
			console.log("delete");
			console.log($stateParams.id);
			patients.delete(patient);
			$state.go('home');
		};
		$scope.uploadFile=function(patient){
			console.log("Upload File for Patient "+$stateParams.id);
			//patients.delete(patient);
			//$state.go('home');
		};
		$scope.onFileSelect = function ($files) {
			$scope.selectedFiles = [];
			$scope.progress = [];
			if ($scope.upload && $scope.upload.length > 0) {
				for (var i = 0; i < $scope.upload.length; i++) {
					if ($scope.upload[i] != null) {
						$scope.upload[i].abort();
					}
				}
			}
			$scope.upload = [];
			$scope.uploadResult = [];
			$scope.selectedFiles = $files;
			$scope.dataUrls = [];
			for (var i = 0; i < $files.length; i++) {
				var $file = $files[i];
				if (window.FileReader && $file.type.indexOf('image') > -1) {
					var fileReader = new FileReader();
					fileReader.readAsDataURL($files[i]);
					function setPreview(fileReader, index) {
						fileReader.onload = function (e) {
							$timeout(function () {
								$scope.dataUrls[index] = e.target.result;
							});
						}
					}

					setPreview(fileReader, i);
				}
				$scope.progress[i] = -1;
				//if ($scope.uploadRightAway) {
				//	$scope.start(i);
				//}
			}
			//console.log('end onFileSelect');
		}
		$scope.start = function (index) {
			$scope.progress[index] = 0;
			console.log('starting...');
			//console.log($scope.myModel);
			console.log($scope.selectedFiles[index]);
			$scope.upload[index] = $upload.upload({
				url: 'upload',
				headers: {'myHeaderKey': 'myHeaderVal'},
				data: {
					title: 'title',
					author: 'mg',
					description: 'desc'
				},
				file: $scope.selectedFiles[index],
				fileFormDataName: 'myFile'
			}).then(function (response) {
				console.log('response', response.data);
				$scope.item=response.data;
				$scope.uploadResult.push(response.data.result);
			}, null, function (evt) {
				$scope.progress[index] = parseInt(100.0 * evt.loaded / evt.total);
			});
			
		}
		
		
	}	
]);
