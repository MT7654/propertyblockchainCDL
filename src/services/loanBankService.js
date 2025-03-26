import { ethers } from 'ethers';
import LoanBankData from "../contracts/LoanBank.json";

const provider = new ethers.providers.Web3Provider(window.ethereum || "http://127.0.0.1:7545");

let loanBankContract = null;

// Dynamically load contract from artifact based on connected network
async function getLoanBankContract() {
  if (loanBankContract) return loanBankContract;

  const network = await provider.getNetwork();
  const networkId = network.chainId.toString();
  const contractAddress = LoanBankData.networks[networkId]?.address;

  if (!contractAddress) {
    throw new Error(`LoanBank contract not found for network ID ${networkId}`);
  }

  const signer = provider.getSigner();
  loanBankContract = new ethers.Contract(contractAddress, LoanBankData.abi, signer);
  return loanBankContract;
}

export async function applyLoan(principal, interestRate, loanDeveloperAddress,  plotId) {
  const contract = await getLoanBankContract();
  const signer = await contract.signer.getAddress();

  try {
    // 1. Create loan on-chain
    const tx = await contract.createLoan(principal, interestRate);
    const receipt = await tx.wait();

    // 2. Parse LoanCreated event
    const loanCreatedEvent = receipt.events?.find((e) => e.event === "LoanCreated");

    if (!loanCreatedEvent || !loanCreatedEvent.args) {
      throw new Error("LoanCreated event not found or invalid");
    }

    const loanIndex = loanCreatedEvent.args.loanIndex?.toNumber();
    console.log("Captured loan index from event:", loanIndex);


    if (loanIndex === undefined || isNaN(loanIndex)) {
      throw new Error("Invalid loan index returned from LoanCreated event");
    }

    // 3. Log to MongoDB only after success
    const ethTopUp = "0.1 ETH";
    const balance = principal;
    const isActive = true;

    const response = await fetch("http://localhost:5001/api/loan-application", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        principal,
        interestRate,
        balance,
        isActive,
        txHash: tx.hash,
        ethTopUp,
        loanDeveloperAddress,
        loanIndex,
        borrowerAddress: signer,
        plotId,
      }),
    });

    if (!response.ok) {
      const msg = await response.text();
      console.error("MongoDB logging failed:", msg);
      throw new Error("Loan created but failed to log to database");
    }

    return { txHash: tx.hash, principal, interestRate, ethTopUp, loanIndex };

  } catch (error) {
    console.error("Error applying for loan:", error);
    throw error; // rethrow so calling function can handle it
  }
}


export async function repayLoan(loanIndex, repaymentAmount, developerAddress) {
  try {
    const contract = await getLoanBankContract();

    console.log("Initiating loan repayment:", { loanIndex, repaymentAmount });

    const tx = await contract.repayLoan(loanIndex, repaymentAmount);
    console.log("Transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);

    const loanRepaidEvent = receipt.events.find(event => event.event === "LoanRepaid");
    if (!loanRepaidEvent) {
      throw new Error("LoanRepaid event not found in transaction receipt");
    }

    const newBalance = loanRepaidEvent.args.remainingBalance.toString();
    const isActive = newBalance !== "0";

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

export async function checkDefault(borrowerAddress) {
  const contract = await getLoanBankContract();

  // Fetch on-chain loan count
  const loanCountBN = await contract.getLoanCount(borrowerAddress);
  const loanCount = loanCountBN.toNumber();
  console.log("✅ On-chain loan count for", borrowerAddress, ":", loanCount);

  if (loanCount === 0) {
    throw new Error("No loans found for this borrower on-chain.");
  }

  // Fetch loans for this borrower from backend
  const response = await fetch(`http://localhost:5001/api/bloans?account=${borrowerAddress}`);
  if (!response.ok) {
    throw new Error("Failed to fetch loans from backend");
  }

  const loans = await response.json();
  console.log("🔍 Backend loans:", loans);

  for (const loan of loans) {
    console.log("🔎 Checking loan:");
    console.log("• isActive:", loan.isActive);
    console.log("• balance:", loan.balance);
    console.log("• loanIndex:", loan.loanIndex);
    console.log("• borrowerAddress:", loan.borrowerAddress);
    console.log("• borrower match:", loan.borrowerAddress?.toLowerCase() === borrowerAddress.toLowerCase());
    console.log("• index valid:", Number(loan.loanIndex) < loanCount);
  }

  // Find the active loan with a valid index
  const activeLoan = loans.find(
    (loan) =>
      loan.isActive === true &&
      Number(loan.balance) > 0 &&
      loan.loanIndex !== undefined &&
      Number(loan.loanIndex) < loanCount &&
      loan.borrowerAddress?.toLowerCase() === borrowerAddress.toLowerCase()
  );

  if (!activeLoan) {
    throw new Error("No active loan with a valid index found for this borrower.");
  }

  const loanIndex = Number(activeLoan.loanIndex);

  console.log("Using loan index:", loanIndex);

  // Interact with smart contract
  const tx = await contract.checkDefault(borrowerAddress, loanIndex);
  await tx.wait();

  return {
    defaulted: true,
    loanIndex,
    txHash: tx.hash
  };
}

export async function requestBankApproval(principal, interestRate) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ approved: true });
    }, 2000);
  });
}

export async function fetchLoansForAccount(account) {
  try {
    const response = await fetch(`http://localhost:5001/api/loans?account=${account}`);
    if (!response.ok) throw new Error(response.statusText);
    return await response.json();
  } catch (error) {
    console.error("Error in fetchLoansForAccount:", error);
    throw error;
  }
}

export async function fetchAllLoans() {
  try {
    const response = await fetch(`http://localhost:5001/api/all-loans`);
    if (!response.ok) throw new Error(response.statusText);
    return await response.json();
  } catch (error) {
    console.error("Error in fetchAllLoans:", error);
    throw error;
  }
  
}
