	var mongoose = require('mongoose');
	var express = require('express');
	var router = express.Router();

	var Post = mongoose.model('Post');
	var Comment = mongoose.model('Comment');
	var Patient = mongoose.model('Patient');

	
	// GET home page. 
	router.get('/', function(req, res, next) {
	  res.render('index', { title: 'Express' });
	});

	//-----------------------------//
	//------- Patient -------------//
	//-----------------------------//
	// get patients
	router.get('/patients', function(req, res, next) {
	  Patient.find(function(err, patients){
		if(err){ return next(err); }

		res.json(patients);
	  });
	});
	// create patient
	router.post('/patients', function(req, res, next) {
	  var patient = new Patient(req.body);
	  patient.save(function(err, patient){
		if(err){ return next(err); }

		res.json(patient);
	  });
	});
	// patient parameter
	router.param('patient', function(req, res, next, id) {
	  var query = Patient.findById(id);

	  query.exec(function (err, patient){
		if (err) { return next(err); }
		if (!patient) { return next(new Error('can\'t find patient')); }

		req.patient = patient;
		return next();
	  });
	});
	
	router.get('/patients/:patient', function(req, res, next) {
		res.json(req.patient);
	});
	
	// update single patient 
	router.put('/patients/:id', function (req, res){
		return Patient.findById(req.params.id, function (err, patient) {
			console.log(req.params.id);
			patient.lastname = req.body.lastname;
			patient.firstname = req.body.firstname;
			console.log(req.body);	
			return patient.save(function (err) {
			  if (!err) {
				console.log("updated");
			  } else {
				console.log(err);
			  }
			  res.json(patient);
			});
		});
	});
	// delete single patient 
	router.delete('/patients/:id', function (req, res){
		Patient.findOneAndRemove({_id : new mongoose.mongo.ObjectID(req.params.id)},function(err){
		//DOES NOT WORK
		//Post.remove({ id: req.params.id }, function(err) {	
		//Post.findByIdAndRemove(req.params.id, function (err) {
			if (!err) {
				return res.send('Patient deleted!');
			} else {
				return res.send('Error deleting patient!');
			}
		});
	});
	
	// get posts
	router.get('/posts', function(req, res, next) {
	  Post.find(function(err, posts){
		if(err){ return next(err); }

		res.json(posts);
	  });
	});

	// create posts
	router.post('/posts', function(req, res, next) {
	  var post = new Post(req.body);

	  post.save(function(err, post){
		if(err){ return next(err); }

		res.json(post);
	  });
	});
	
	router.param('post', function(req, res, next, id) {
	  var query = Post.findById(id);

	  query.exec(function (err, post){
		if (err) { return next(err); }
		if (!post) { return next(new Error('can\'t find post')); }

		req.post = post;
		return next();
	  });
	});

	router.get('/posts/:post', function(req, res, next) {
	  req.post.populate('comments', function(err, post) {
		if (err) { return next(err); }

		res.json(post);
	  });
	});
	
	// update single post 
	router.put('/posts/:id', function (req, res){
		return Post.findById(req.params.id, function (err, post) {
			console.log(req.params.id);
			post.title = req.body.title;
			post.link = req.body.link;
			console.log(req.body);	
			return post.save(function (err) {
			  if (!err) {
				console.log("updated");
			  } else {
				console.log(err);
			  }
			  //return res.send(post);
			  res.json(post);
			});
		});
	});
	// delete single post 
	router.delete('/posts/:id', function (req, res){
		Post.findOneAndRemove({_id : new mongoose.mongo.ObjectID(req.params.id)},function(err){
		//DOES NOT WORK
		//Post.remove({ id: req.params.id }, function(err) {	
		//Post.findByIdAndRemove(req.params.id, function (err) {
			if (!err) {
				return res.send('Post deleted!');
			} else {
				return res.send('Error deleting post!');
			}
		});
	});
	
	router.put('/posts/:post/upvote', function(req, res, next) {
	  req.post.upvote(function(err, post){
		if (err) { return next(err); }

		res.json(post);
	  });
	});

	router.post('/posts/:post/comments', function(req, res, next) {
	  var comment = new Comment(req.body);
	  comment.post = req.post;

	  comment.save(function(err, comment){
		if(err){ return next(err); }

		req.post.comments.push(comment);
		req.post.save(function(err, post) {
		  if(err){ return next(err); }

		  res.json(comment);
		});
	  });
	});

	/*router.get('/posts/:post/comments', function(req, res, next) {
	  Post.find(function(err, posts){
		if(err){ return next(err); }

		res.json(posts);
	  });
	});*/

	router.param('comment', function(req, res, next, id) {
	  var query = Comment.findById(id);

	  query.exec(function (err, comment){
		if (err) { return next(err); }
		if (!comment) { return next(new Error('can\'t find post')); }

		req.comment = comment;
		return next();
	  });
	});

	router.put('/posts/:post/comments/:comment/upvote', function(req, res, next) {
	  req.comment.upvote(function(err, comment){
		if (err) { return next(err); }

		res.json(comment);
	  });
	});

	module.exports = router;