var app = angular.module('flapperNews', ['ui.router','angularUtils.directives.dirPagination','angularModalService','angular-growl']);

app.factory('posts', ['$http','growl', function($http,growl){
  var o = {
    posts: []
  };
  
  //Get all posts from MongoDB
  //Copy data 
  o.getAll = function() {
    return $http.get('/posts').success(function(data){
      angular.copy(data, o.posts);
    });
  };
  
	o.create = function(post) {
	  //var title = 'test';//post._title;
	  return $http.post('/posts', post).success(function(data){
		o.posts.push(data);
		//--redirect to the homepage
		window.location='#/home';
		//var config = {};
		growl.success("<b>Patient créé ");//, config);
		///alert('Créé');
	  });
	};
	
	/*o.update = function(post) {
		//return $http.put('/posts/' + post._id).success(function(data){
		//return $http.put('/posts/' + post._id + '/edit').success(function(data){
			//post.title='My title';
			//--redirect to the homepage
			window.location='#/home';
			growl.success("<b>Patient mis à jour ");//, config);
		//});
	};*/
	
	//--WORKS with 	
	o.update = function(post) {
		return $http.put('/posts/'+ post._id, post)
			.success(function(data){
				//.then(function(res){
				console.log("updated");
				o.posts.push(data);
				//growl.success("<b>Patient mis à jour ");//, config);
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
	o.delete = function(post){
		return $http.delete('/posts/'+ post._id, post)
			.success(function(data){
				console.log("deleted");
				//o.posts.push(data);
				//growl.success("<b>Patient mis à jour ");//, config);
			})
			.error(function(data){
				console.log("error "+data);
			});
	}
	
	o.upvote = function(post) {
		return $http.put('/posts/' + post._id + '/upvote')
		.success(function(data){
			post.upvotes += 1;
		});
	}; 	

	// get post attributes
	o.get = function(id) {
		return $http.get('/posts/' + id).then(function(res){
			return res.data;
		});
	};
	
	// add comment to post
	o.addComment = function(id, comment) {
		return $http.post('/posts/' + id + '/comments', comment);
	};
	
	//
	o.upvoteComment = function(post, comment) {
  return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote')
    .success(function(data){
      comment.upvotes += 1;
    });
};

  return o;
}]);	




app.controller('MainCtrl', [
'$scope',
'$filter',
'posts',
'ModalService',
function($scope, $filter, posts,ModalService){
	//$scope.posts = posts.posts;
	$scope.posts = $filter('filter')(posts.posts, $scope.query);
	//Add sort functionnality
	$scope.sort = function(keyname){
        $scope.sortKey = keyname;   //set the sortKey to the param passed
        $scope.reverse = !$scope.reverse; //if true make it false and vice versa
    }
	//Default items per Page
	$scope.pageSize = 10;
	$scope.addPost = function(){
		if(!$scope.title || $scope.title === '') { return; }
		/*$scope.posts.push({
			title: $scope.title,
			link: $scope.link, 
			upvotes: 0,
		    comments: [
				{author: 'Joe', body: 'Cool post!', upvotes: 0},
				{author: 'Bob', body: 'Great idea but everything is wrong!', upvotes: 0}
			]
		});*/
		posts.create({
			title: $scope.title,
			link: $scope.link,
		});
		$scope.title = '';
		$scope.link = '';
	};
	$scope.incrementUpvotes = function(post){
		/*post.upvotes += 1;*/
		posts.upvote(post);
	};
	/*$scope.update = function(post){
		posts.update(post);
	};*/
	/* */
	$scope.openPostForm = function() {
		ModalService.showModal({
		  templateUrl: "../templates/postForm.html"/*,
		  controller: "ComplexController",
		  inputs: {
			title: "A More Complex Example"
		  }*/
		}).then(function(modal) {
		  modal.element.modal();
		  /*modal.close.then(function(result) {
			$scope.complexResult  = "Name: " + result.name + ", age: " + result.age;
		  });*/
		}).catch(function(error) {
		  // error contains a detailed error message.
		  console.log(error);
		});
	};
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
			postPromise: ['posts', function(posts){
			  return posts.getAll();
			}]
		}
    })
	.state('posts', {
		url: '/posts/{id}',
		templateUrl: 'templates/posts.html',
		controller: 'PostsCtrl',
		  resolve: {
			post: ['$stateParams', 'posts', function($stateParams, posts) {
			  return posts.get($stateParams.id);
			}]
		  }
	})
	.state('postForm', {
		url: '/postForm',
		templateUrl: 'templates/postForm.html',
		controller: 'PostFormCtrl'
	})
	.state('createPatient', {
		url: '/createPatient',
		templateUrl: 'templates/createPatient.html',
		controller: 'createPatientCtrl'
	})
	.state('postEdit', {
		url: '/posts/{id}/edit',
		templateUrl: 'templates/edit.html',
		controller: 'PostEditCtrl',
		resolve: {
			post: ['$stateParams', 'posts', function($stateParams, posts) {
			  return posts.get($stateParams.id);
			}]
		  }
	})
	/*.state('postEdit', {
		url: '/posts/{id}/edit',
		templateUrl: 'templates/edit.html',
		controller: 'PostEditCtrl',
		resolve: {
			post: ['$stateParams', 'posts', function($stateParams, posts) {
			  return posts.get($stateParams.id);
			}]
		  }
	})*/
	;

  $urlRouterProvider.otherwise('home');
}]);
//notification
app.config(['growlProvider', function (growlProvider) {
  growlProvider.globalTimeToLive(3000);
}]);

app.controller('PostsCtrl', [
	'$scope',
	'posts',
	'post',
	//function($scope, $stateParams, posts){
	function($scope, posts, post){	
		$scope.post = post;//posts.posts[$stateParams.id];
		$scope.addComment = function(){
			if($scope.body === '') { return; }
			posts.addComment(post._id, {
				body: $scope.body,
				author: 'user',
			}).success(function(comment) {
				$scope.post.comments.push(comment);
			});
			$scope.body = '';
		};
		$scope.incrementUpvotes = function(comment){
					posts.upvoteComment(post,comment);
			};
	
}]);
app.controller('createPatientCtrl', [
	'$scope',
	'posts',
	'growl',
	function($scope, posts, growl){	
		$scope.addPost = function(){
			if(!$scope.title || $scope.title === '') { return; }
			posts.create({
				title: $scope.title,
				link: $scope.link
			});
			$scope.title = '';
			$scope.link = '';
		};
		$scope.createPatient = function(){
			if(!$scope.title || $scope.title === '') { return; }
			posts.create({
				title: $scope.title,
				link: $scope.link
			});
			$scope.title = '';
			$scope.link = '';
		};
		$scope.notify = function(){
			var config = {};
			growl.success("<b>Demo", config);
		};
	}
]);
app.controller('PostEditCtrl', [
	'$scope',
	'$state',
	'$stateParams',
	'posts',
	'post',
	
	function($scope, $state, $stateParams, posts,post){	
		$scope.post = post;
		//DOESNT WORK
		//$scope.post = posts.get($stateParams.id);
		
		$scope.updatePost=function(post){
			console.log('in update process');
			console.log("update id : "+ post._id);
			console.log($stateParams.id);
			//posts.update({id: post._id}, $scope.post);
			posts.update(post, {title: $scope.title,
								link: $scope.link});
			
			//console.log("updated");
			$state.go('home');
		};
		
		$scope.deletePost=function(post){
			console.log("delete");
			console.log($stateParams.id);
			posts.delete(post);
			$state.go('home');
		}
	}	
]);

app.controller('PostEditCtrl2',['$scope','$state','$stateParams','posts','post',function($scope,$state,$stateParams,posts,post){
	$scope.post = post;
	/*,
	function($scope, $state,	posts, post){	
		//$scope.post = post;
		$scope.title = post.title;
		$scope.link = post.link;
		$scope._id = post._id;*/
		
		/*$scope.updatePost=function(){
			$scope.post.$update(function(){
				$state.go('home');
			});
		};
		$scope.loadPost=function(){
			$scope.post=posts.get({id:$stateParams.id});
		};
		$scope.loadPost();
		*/
		/*$scope.updatePost = function(){
			if(!$scope.title || $scope.title === '') { return; }
			
			//posts.update({
			//	_id : $scope._id,
			//	title: 'z44',//$scope.title,
			//	link: 'z44'//$scope.link
			//});
			
			posts.update({id: post._id}, post);
			//$scope.title = '';
			//$scope.link = '';
			//$location.path='/home';
		};*/
	}
	]
	);
