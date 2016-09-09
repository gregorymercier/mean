var app = angular.module('flapperNews', ['ui.router','angularUtils.directives.dirPagination','angularModalService','angular-growl']);

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
			window.location='#/home';
			growl.success("Patient créé ");
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
	;

  $urlRouterProvider.otherwise('home');
}]);
//notification
app.config(['growlProvider', function (growlProvider) {
  growlProvider.globalTimeToLive(3000);
}]);



// homepage - display all patients
app.controller('MainCtrl', [
'$scope',
'$filter',
'patients',
function($scope, $filter, patients){
	$scope.patients = $filter('filter')(patients.patients, $scope.query);
	//Add sort functionnality
	$scope.sort = function(keyname){
        $scope.sortKey = keyname;   //set the sortKey to the param passed
        $scope.reverse = !$scope.reverse; //if true make it false and vice versa
    }
	//Default items per Page
	$scope.sort('lastname');
	$scope.pageSize = 10;
}]);
// Patient Form
app.controller('createPatientCtrl', [
	'$scope',
	'patients',
	function($scope, patients){	
		$scope.createPatient = function(){
			if(!$scope.lastname || $scope.firstname === '') { return; }
			patients.create({
				lastname: $scope.lastname,
				firstname: $scope.firstname
			});
			window.location='#/home';
			growl.success("Patient créé ");
		};
		
	}
]);
app.controller('updatePatientCtrl', [
	'$scope',
	'$state',
	'$stateParams',
	'patients',
	'patient',
	
	function($scope, $state, $stateParams, patients,patient){	
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
		}
		
	}	
]);
