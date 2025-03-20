// models/LandRegistration.js
const mongoose = require('mongoose');

const LandRegistrationSchema = new mongoose.Schema({
  plotId: Number,
  metadata: String,
  ownerDetails: String,
  nftToken: String,
  txHash: String,
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('LandRegistration', LandRegistrationSchema);
