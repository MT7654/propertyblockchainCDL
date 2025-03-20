import { ethers } from 'ethers';
import LoanBankData from "../contracts/LoanBank.json";

const loanBankABI = LoanBankData.abi;
const loanBankAddress = "0x690c17B342043aC5682979D0a40f6ba6AE6d2Ca6";

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const loanBankContract = new ethers.Contract(loanBankAddress, loanBankABI, signer);

/**
 * Apply for a new loan.
 * @param {number} principal - The loan principal.
 * @param {number} interestRate - The interest rate.
 * @param {string} loanDeveloperAddress - The developer's address (for logging only).
 * @returns {object} - An object containing the transaction hash and loan details.
 */
export async function applyLoan(principal, interestRate, loanDeveloperAddress) {
  // Forward the loan application to the Public Bank then invoke createLoan on LoanBank.
  const tx = await loanBankContract.createLoan(principal, interestRate);
  await tx.wait(); // Wait for the LoanCreated event.
  const ethTopUp = "0.1 ETH";

  // The new loan's starting balance is equal to the principal, and it's active.
  const balance = principal;
  const isActive = true;

  // Log the loan application to MongoDB via your backend API.
  await fetch('http://localhost:5001/api/loan-application', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      principal,
      interestRate,
      balance: principal,
      isActive: true,
      txHash: tx.hash,
      ethTopUp,
      loanDeveloperAddress,
    }),
  });
  return { txHash: tx.hash, principal, interestRate, ethTopUp };
}

/**
 * Repay a specific loan.
 * @param {number} loanIndex - The index of the loan to repay.
 * @param {number} repaymentAmount - The amount to repay.
 * @returns {object} - An object containing the transaction hash and new balance (if retrievable).
 */
export async function repayLoan(loanIndex, repaymentAmount, developerAddress) {
  try {
    console.log("Initiating loan repayment:", { loanIndex, repaymentAmount });

    const tx = await loanBankContract.repayLoan(loanIndex, repaymentAmount);
    console.log("Transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);

    const loanRepaidEvent = receipt.events.find(event => event.event === "LoanRepaid");
    if (!loanRepaidEvent) {
      throw new Error("LoanRepaid event not found in transaction receipt");
    }

    const newBalance = loanRepaidEvent.args.remainingBalance.toString();
    const isActive = newBalance !== "0";

    console.log("Updating loan:", { developerAddress, newBalance, isActive });

    const response = await fetch('http://127.0.0.1:5001/api/loan-application/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      cache: "no-cache",
      body: JSON.stringify({
        loanDeveloperAddress: developerAddress,
        newBalance,
        isActive,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log("API Response:", responseData);

    return { txHash: tx.hash, newBalance };
  } catch (error) {
    console.error("Error in repayLoan:", error);
    throw error;
  }
}



/**
 * Check for default on a specific loan.
 * @param {string} borrower - The borrower's address.
 * @param {number} loanIndex - The index of the loan to check.
 * @returns {object} - An object indicating whether the loan is defaulted.
 */
export async function checkDefault(borrower, loanIndex) {
  // Call the checkDefault function with both borrower and loan index.
  const tx = await loanBankContract.checkDefault(borrower, loanIndex);
  await tx.wait();
  // For demonstration, assume checkDefault returns a default event.
  return { defaulted: true }; // In practice, extract this from an event or a view call.
}

/**
 * Simulate sending the loan application to the Public Bank for approval.
 * @param {number} principal
 * @param {number} interestRate
 * @returns {Promise<object>} - A promise that resolves with an approval result.
 */
export async function requestBankApproval(principal, interestRate) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ approved: true });
    }, 2000);
  });
}

// ---------------------------------------------
  // Fetch Loans from database
  // ---------------------------------------------
export async function fetchLoansForAccount(account) {
  try {
    const response = await fetch(`http://localhost:5001/api/loans?account=${account}`);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const data = await response.json();
    return data; // Return the fetched loans
  } catch (error) {
    console.error("Error in fetchLoansForAccount:", error);
    throw error;
  }
}

export async function fetchAllLoans() {
  try {
    const response = await fetch(`http://localhost:5001/api/all-loans`);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const data = await response.json();
    return data; // Return the fetched loans
  } catch (error) {
    console.error("Error in fetchAllLoans:", error);
    throw error;
  }
}
