var mongoose = require('mongoose');

var PatientSchema = new mongoose.Schema({
  lastname : String, //required
  firstname: String,
  file : [{ fileid: String, filename : String}],
 // files : [{ type: mongoose.Schema.Types.ObjectId, ref: 'File'}] //https://github.com/aheckmann/gridfs-stream/issues/74
  email:String,
  phone:String,
  phone2:String,
  address: String,
  zipcode: String,
  city: String
});

mongoose.model('Patient', PatientSchema);