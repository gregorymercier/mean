var mongoose = require('mongoose');

var PatientSchema = new mongoose.Schema({
  lastname : String, //required
  firstname: String,
  files : [{ type: mongoose.Schema.Types.ObjectId, ref: 'PatientsFiles'}]
  /*email:String,
  phone:String,
  phone2:String,
  address: String,
  zipcode: String,
  city: String*/
});

mongoose.model('Patient', PatientSchema);