// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LoanBank {
    struct Loan {
        uint256 principal;
        uint256 interestRate; // e.g. as a percentage
        uint256 balance; // Outstanding amount
        bool isActive;
    }
    
    mapping(address => Loan) public loans;

    event LoanCreated(address indexed borrower, uint256 principal, uint256 interestRate);
    event LoanRepaid(address indexed borrower, uint256 amount, uint256 remainingBalance);
    event DeveloperDefaulted(address indexed borrower);

    // FR2: Loan Application – Developer applies for a loan.
    // Only one active loan is allowed per borrower.
    function createLoan(uint256 principal, uint256 interestRate) public {
        require(!loans[msg.sender].isActive, "Active loan already exists");
        loans[msg.sender] = Loan(principal, interestRate, principal, true);
        emit LoanCreated(msg.sender, principal, interestRate);
    }

    // FR4: Loan Repayment – Developer repays part or all of the loan.
    function repayLoan(uint256 amount) public {
        Loan storage loan = loans[msg.sender];
        require(loan.isActive, "No active loan");
        require(amount <= loan.balance, "Repayment exceeds outstanding balance");
        loan.balance -= amount;
        if (loan.balance == 0) {
            loan.isActive = false;
        }
        emit LoanRepaid(msg.sender, amount, loan.balance);
    }

    // FR5: Default Check – Public Bank can trigger a default check.
    // For demonstration, if a loan is active and balance > 0, it is considered defaulted.
    function checkDefault(address borrower) public {
        Loan storage loan = loans[borrower];
        require(loan.isActive, "No active loan");
        if (loan.balance > 0) {
            emit DeveloperDefaulted(borrower);
        }
    }
}
