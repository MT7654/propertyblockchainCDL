// models/LoanApplication.js
const mongoose = require('mongoose');

const LoanApplicationSchema = new mongoose.Schema({
  principal: Number,
  interestRate: Number,
  balance: Number,          // Outstanding balance, set equal to principal when created
  isActive: {               // Indicates if the loan is active or repaid
    type: Boolean,
    default: true
  },
  txHash: String,
  ethTopUp: String,
  loanDeveloperAddress: String,
  loanIndex: Number,        // Add loanIndex for contract-level identification
  borrowerAddress: String,
  date: { type: Date, default: Date.now },
  plotId: Number,
});

module.exports = mongoose.model('LoanApplication', LoanApplicationSchema);
