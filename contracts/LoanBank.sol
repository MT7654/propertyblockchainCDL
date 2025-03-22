// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import SafeMath from OpenZeppelin
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract LoanBank {
// Use SafeMath for uint256
using SafeMath for uint256;
        struct Loan {
        uint256 principal;
        uint256 interestRate; // e.g. as a percentage
        uint256 balance;      // Outstanding amount
        bool isActive;
    }
    
    // Each borrower (address) can have multiple loans.
    mapping(address => Loan[]) public loans;

    event LoanCreated(address indexed borrower, uint256 principal, uint256 interestRate, uint256 loanIndex);
    event LoanRepaid(address indexed borrower, uint256 amount, uint256 remainingBalance, uint256 loanIndex);
    event DeveloperDefaulted(address indexed borrower, uint256 loanIndex);

    /**
     * @notice Create a new loan for the caller.
     * @param principal The loan amount.
     * @param interestRate The interest rate (e.g., as a percentage).
     *
     * This function no longer restricts borrowers to only one active loan.
     */
    function createLoan(uint256 principal, uint256 interestRate) public {
        Loan memory newLoan = Loan({
            principal: principal,
            interestRate: interestRate,
            balance: principal,
            isActive: true
        });
        loans[msg.sender].push(newLoan);
        uint256 loanIndex = loans[msg.sender].length - 1;
        emit LoanCreated(msg.sender, principal, interestRate, loanIndex);
    }

    /**
     * @notice Repay a specific loan for the caller.
     * @param loanIndex The index of the loan in the borrower's array.
     * @param amount The amount to repay.
     *
     * Requirements:
     * - The loanIndex must be valid.
     * - The specified loan must be active.
     * - The repayment amount must not exceed the outstanding balance.
     */
    function repayLoan(uint256 loanIndex, uint256 amount) public {
        require(loanIndex < loans[msg.sender].length, "Invalid loan index");
        Loan storage loan = loans[msg.sender][loanIndex];
        require(loan.isActive, "No active loan at this index");
        require(amount <= loan.balance, "Repayment exceeds outstanding balance");
        loan.balance -= amount;
        if (loan.balance == 0) {
            loan.isActive = false;
        }
        emit LoanRepaid(msg.sender, amount, loan.balance, loanIndex);
    }

    /**
     * @notice Check for default on a specific loan.
     * @param borrower The address of the borrower.
     * @param loanIndex The index of the loan in the borrower's array.
     *
     * For demonstration, if the loan is active and its balance is greater than zero,
     * the loan is considered defaulted.
     */
    function checkDefault(address borrower, uint256 loanIndex) public {
        require(loanIndex < loans[borrower].length, "Invalid loan index");
        Loan storage loan = loans[borrower][loanIndex];
        require(loan.isActive, "No active loan at this index");
        if (loan.balance > 0) {
            emit DeveloperDefaulted(borrower, loanIndex);
        }
    }
}
