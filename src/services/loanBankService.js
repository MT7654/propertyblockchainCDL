import { ethers } from 'ethers';

// Replace with your actual ABI and contract address.
const loanBankABI = [
  // ... ABI for createLoan, repayLoan, checkDefault, and events like LoanCreated, LoanRepaid, DeveloperDefaulted ...
];
const loanBankAddress = "0xYourLoanBankContractAddress";

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const loanBankContract = new ethers.Contract(loanBankAddress, loanBankABI, signer);

export async function applyLoan(principal, interestRate) {
  // FR2.2: Forward the loan application to the Public Bank then invoke createLoan on LoanBank.
  const tx = await loanBankContract.createLoan(principal, interestRate);
  await tx.wait(); // FR2.5: Wait for the LoanCreated event.
  return { txHash: tx.hash, principal, interestRate, ethTopUp: "0.1 ETH" };
}

export async function repayLoan(repaymentAmount) {
  // FR4.2: Invoke repayLoan on the LoanBank.
  const tx = await loanBankContract.repayLoan(repaymentAmount);
  await tx.wait(); // FR4.3: Wait for the LoanRepaid event.
  return { txHash: tx.hash, newBalance: "Remaining_Balance" };
}

export async function checkDefault(loanId) {
  // FR5.2: Trigger the checkDefault function.
  const tx = await loanBankContract.checkDefault(loanId);
  await tx.wait();
  // For demonstration, assume checkDefault returns a boolean status.
  return { defaulted: true }; // In practice, extract this from the event or a contract call.
}
