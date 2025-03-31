// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract LoanBank {
    using SafeMath for uint256;

    struct Loan {
        uint256 principal;
        uint256 interestRate; // e.g., 260 = 2.6%
        uint256 balance;  // Outstanding amount
        bool isActive;
    }

    // Map: borrower => list of loans
    mapping(address => Loan[]) private loans;

    event LoanCreated(address indexed borrower, uint256 principal, uint256 interestRate, uint256 loanIndex);
    event LoanRepaid(address indexed borrower, uint256 amount, uint256 remainingBalance, uint256 loanIndex);
    event DeveloperDefaulted(address indexed borrower, uint256 loanIndex);

    modifier validLoanIndex(address borrower, uint256 index) {
        require(index < loans[borrower].length, "Invalid loan index");
        _;
    }

    /**
     * @notice Create a new loan for the caller.
     * @param principal The loan amount.
     * @param interestRate The interest rate (e.g., as a percentage).
     *
     * This function no longer restricts borrowers to only one active loan.
     */

    function createLoan(uint256 principal, uint256 interestRate) external {
        require(principal > 0, "Principal must be greater than 0");
        require(interestRate <= 10000, "Interest rate too high"); // max 100%

        Loan memory loan = Loan({
            principal: principal,
            interestRate: interestRate,
            balance: principal,
            isActive: true
        });

        loans[msg.sender].push(loan);
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

    function repayLoan(uint256 index, uint256 amount)
        external
        validLoanIndex(msg.sender, index)
    {
        require(amount > 0, "Amount must be greater than 0");

        Loan storage loan = loans[msg.sender][index];
        require(loan.isActive, "Loan is not active");
        require(amount <= loan.balance, "Repayment exceeds balance");

        loan.balance = loan.balance.sub(amount);
        if (loan.balance == 0) {
            loan.isActive = false;
        }

        emit LoanRepaid(msg.sender, amount, loan.balance, index);
    }

     /**
     * @notice Check for default on a specific loan.
     * @param borrower The address of the borrower.
     * @param loanIndex The index of the loan in the borrower's array.
     *
     * For demonstration, if the loan is active and its balance is greater than zero,
     * the loan is considered defaulted.
     */

    function checkDefault(address borrower, uint256 index)
        external
        validLoanIndex(borrower, index)
    {
        Loan storage loan = loans[borrower][index];
        require(loan.isActive, "Loan already closed");

        if (loan.balance > 0) {
            emit DeveloperDefaulted(borrower, index);
        }
    }

    /**
    * @notice Get the total number of loans for a borrower.
    * @param borrower The address of the borrower.
    * @return The number of loans.
    */

    function getLoanCount(address borrower) external view returns (uint256) {
        return loans[borrower].length;
    }

    function getLoan(address borrower, uint256 index)
        external
        view
        validLoanIndex(borrower, index)
        returns (
            uint256 principal,
            uint256 interestRate,
            uint256 balance,
            bool isActive
        )
    {
        Loan memory loan = loans[borrower][index];
        return (loan.principal, loan.interestRate, loan.balance, loan.isActive);
    }
}
