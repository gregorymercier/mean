	var mongoose = require('mongoose');
	var express = require('express');
	var router = express.Router();
	var Busboy = require('busboy'); // 0.2.9
	
	var Grid = require('gridfs-stream');
	Grid.mongo = mongoose.mongo;
	var gfs = new Grid(mongoose.connection.db);
	
	var Post = mongoose.model('Post');
	var Comment = mongoose.model('Comment');
	var Patient = mongoose.model('Patient');
	//define Model for metadata collection.
	//Schema = mongoose.Schema;
	//var gridSchema = new Schema({},{ strict: false });
	//var Grid = mongoose.model("Grid", gridSchema, "fs.files" );
	var Schema = mongoose.Schema;
	const FileSchema = new Schema({}, { strict: false }, 'fs.files');
	var File = mongoose.model('File', FileSchema);
	
	// GET home page. 
	router.get('/', function(req, res, next) {
	  res.render('index', { title: 'Express' });
	});
	//-----------------------------//
	//------- Patient -------------//
	//-----------------------------//
	// get all patients
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
	// get single patient
	router.get('/patients/:patient', function(req, res, next) {
		/*req.patient.populate('files', function(err, patient) {
		if (err) { return next(err); }
			res.json(req.patient);
		});*/
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
	/////////////////////////////
	// images //
	/////////////////////////////
	router.post('/upload/:id',function(req, res) {
		console.log('in router /upload/'+req.params.id);
		var part = req.files.file;
		var fileId = new mongoose.mongo.ObjectID();
		var writeStream = gfs.createWriteStream({
							_id: fileId,
							filename: part.name,
							mode: 'w',
							content_type:part.mimetype
						});
		writeStream.on('close', function() {
			console.log('Download successfully : '+fileId);
			console.log('File name : '+part.name);
			console.log('File ID : '+fileId);
			Patient.findById(req.params.id, function(err, patient) {
				// handle error
				
				patient.file.push({'fileid': fileId,'filename' : part.name});// = file._id;
				//patient.files.filename.push('demo');// = file._id;
				return patient.save(function (err) {
				  if (!err) {
					console.log("updated");
				  } else {
					console.log(err);
				  }
				  res.json(patient);
				});
				/*return res.status(200).send({
				message: 'Success '+ fileId//part.name
			});*/
			});
        });
        writeStream.write(part.data);
		writeStream.end();
	});
	//http://stackoverflow.com/questions/31176395/node-js-upload-and-download-pdf-file
	router.get('/file/:id', function(req, res) {
		//gfs.files.find({ filename: req.params.id }).toArray(function (err, files) {
		gfs.files.find({ _id: new mongoose.mongo.ObjectID(req.params.id)}).toArray(function (err, files) {
			if(files.length===0){
				return res.status(400).send({
					message: 'File not found'
				});
			}
			res.writeHead(200, {'Content-Type': files[0].contentType});
			var readstream = gfs.createReadStream({
				filename: files[0].filename
			});
			readstream.on('data', function(data) {
				res.write(data);
			});
			readstream.on('end', function() {
				res.end();        
			});
			readstream.on('error', function (err) {
			  console.log('An error occurred!', err);
			  throw err;
			});
		});
	});
	router.delete('/file/:id', function(req, res) {
		//patient.files.push(fileId);
		gfs.remove({ _id: new mongoose.mongo.ObjectID(req.params.id)}, function (err) {
			if (err) return handleError(err);
			console.log('success');
		});
	});
	router.delete('/patients/:patient/file/:id', function(req, res) {
		console.log('Patient : '+req.patient._id);
		console.log('File : '+req.params.id);
		req.patient.files.remove(req.params.id);
		return req.patient.save(function (err) {
				  if (!err) {
					console.log("updated");
				  } else {
					console.log(err);
				  }
				  res.json(req.patient);
				});
		gfs.remove({ _id: new mongoose.mongo.ObjectID(req.params.id)}, function (err) {
			if (err) return handleError(err);
			console.log('success');
		});
	});
	
	//http://stackoverflow.com/questions/32073183/mongodb-populate-gridfs-files-metadata-in-parent-document
	router.get('/file', function(req, res) {
	/*  gfs.files.find(function(err, files){
		if(err){ return next(err); }
		res.json(files);
	  });*/
		gfs.files.find().toArray(function (err, files) {
			if (err) throw err;
			console.log(files);
		})
		/*Grid.find({},function(err,gridfiles) {
			if (err) throw err;
			console.log( gridfiles );
		});*/
		console.log('list files');
	});

	///////////////////////////////////////
	///////////////////////////////////////
	// get posts
	/*router.get('/posts', function(req, res, next) {
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
	});*/

	/*router.get('/posts/:post/comments', function(req, res, next) {
	  Post.find(function(err, posts){
		if(err){ return next(err); }

		res.json(posts);
	  });
	});*/

	/*router.param('comment', function(req, res, next, id) {
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
*/
	module.exports = router;