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
    o.deleteFile = function(file){
		return $http.delete('/file/'+ file._id)
			.success(function(data){
				console.log("file deleted");
			})
			.error(function(data){
				console.log("error "+data);
			});
	}	

  return o;
}]);	

app.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
            
            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);
app.service('fileUpload', ['$http', function ($http) {
    this.uploadFileToUrl = function(file, uploadUrl){
        var fd = new FormData();
        fd.append('file', file);
        $http.post(uploadUrl, fd, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
        })
        .success(function(){
			console.log("upload done");
        })
        .error(function(){
			console.log("upload done");
        });
    }
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
	'FileUploader',
	function($scope, $state, $stateParams, patients,patient,$timeout,FileUploader){//,toastr){	
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
		// file upload
		$scope.uploader = new FileUploader();
		var uploadURL = '/upload/'+patient._id;//'api/upload/’ + currentUser._id
		console.log(uploadURL);
		$scope.uploadOptions = {
			queueLimit: 1,
			autoUpload: true,
			url: uploadURL
		}
 
		$scope.uploadFile = function(){
			if (!$scope.uploader.queue[0]) return;
			$scope.uploader.queue[0].upload(); 
			console.log('Upload File');
			//$state.go('updatePatient');
		}
		$scope.deleteFile = function(){
			alert('delete file');
		}		
	}	
]);
