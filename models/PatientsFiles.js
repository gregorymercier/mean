var mongoose = require('mongoose');

var PatientFileSchema = new mongoose.Schema({
  fileid : String,
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }
});

mongoose.model('PatientFile', PatientFileSchema);