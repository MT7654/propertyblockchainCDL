const LoanBank = artifacts.require("LoanBank");

module.exports = function(deployer) {
  deployer.deploy(LoanBank);
};
