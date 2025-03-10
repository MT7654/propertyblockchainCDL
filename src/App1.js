import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import LandRegistryData from "./contracts/LandRegistry.json";
import LoanBankData from "./contracts/LoanBank.json";

// Extract ABIs from the JSON artifacts
const landRegistryABI = LandRegistryData.abi;
const loanBankABI = LoanBankData.abi;

// Smart contract addresses (update if needed)
const landRegistryAddress = "0x65F9Ba54F8773d9f066434B6A413f15B35116D2e";
const loanBankAddress = "0x438f65184C0B0b6cbbd62a9E9682D2A120C10237";

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [landRegistry, setLandRegistry] = useState(null);
  const [loanBank, setLoanBank] = useState(null);
  const [govOfficer, setGovOfficer] = useState(null);
  const [message, setMessage] = useState("");

  // Form state for Land Registration (FR1)
  const [regPlotId, setRegPlotId] = useState("");
  const [regMetadata, setRegMetadata] = useState("");
  const [regOwner, setRegOwner] = useState("");

  // Form state for Loan Application (FR2)
  const [loanPrincipal, setLoanPrincipal] = useState("");
  const [loanInterest, setLoanInterest] = useState("");

  // Form state for Land Purchase (FR3) – by providing Plot ID
  const [purchasePlotId, setPurchasePlotId] = useState("");

  // Form state for Loan Repayment (FR4)
  const [repayAmount, setRepayAmount] = useState("");

  useEffect(() => {
    async function loadBlockchainData() {
      if (window.ethereum) {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const signer = provider.getSigner();
          const account = await signer.getAddress();

          setAccount(account);
          setProvider(provider);
          setSigner(signer);

          console.log("Land Registry ABI:", landRegistryABI);
          console.log("Loan Bank ABI:", loanBankABI);

          // Initialize smart contract instances using the signer
          const landRegistryContract = new ethers.Contract(
            landRegistryAddress,
            landRegistryABI,
            signer
          );
          const loanBankContract = new ethers.Contract(
            loanBankAddress,
            loanBankABI,
            signer
          );

          setLandRegistry(landRegistryContract);
          setLoanBank(loanBankContract);

          // Retrieve the contract owner (Government Officer) from LandRegistry (Ownable)
          const ownerAddress = await landRegistryContract.owner();
          setGovOfficer(ownerAddress);
        } catch (error) {
          console.error("Error loading blockchain data:", error);
          alert("Error connecting to blockchain. Please try again.");
        }
      } else {
        alert("Please install MetaMask!");
      }
    }
    loadBlockchainData();
  }, []);

  // FR1: Land Registration (Government Officer)
  async function handleRegisterLand(e) {
    e.preventDefault();
    try {
      const plotId = parseInt(regPlotId, 10);
      // This function call will revert if the caller is not the owner.
      const tx = await landRegistry.registerLand(plotId, regMetadata, regOwner);
      await tx.wait();
      alert("Land registered successfully and NFT issued!");
      setMessage("Land registered successfully!");
    } catch (error) {
      console.error(error);
      alert("Land registration failed. Ensure you are using the Government Officer account.");
      setMessage("Land registration failed.");
    }
  }

  // FR2: Loan Application (Developer)
  async function handleApplyForLoan(e) {
    e.preventDefault();
    try {
      const principal = parseInt(loanPrincipal, 10);
      const interestRate = parseFloat(loanInterest);
      const tx = await loanBank.createLoan(principal, interestRate);
      await tx.wait();
      alert("Loan applied successfully! (Awaiting Public Bank approval)");
      setMessage("Loan applied successfully!");
    } catch (error) {
      console.error(error);
      alert("Loan application failed.");
      setMessage("Loan application failed.");
    }
  }

  // FR3: Land Purchase (Developer)
  async function handlePurchaseLand(e) {
    e.preventDefault();
    try {
      const plotId = parseInt(purchasePlotId, 10);
      const tx = await landRegistry.purchaseLand(plotId);
      await tx.wait();
      alert("Land purchased successfully!");
      setMessage("Land purchased successfully!");
    } catch (error) {
      console.error(error);
      alert("Land purchase failed.");
      setMessage("Land purchase failed.");
    }
  }

  // FR4: Loan Repayment (Developer)
  async function handleRepayLoan(e) {
    e.preventDefault();
    try {
      const amount = parseInt(repayAmount, 10);
      const tx = await loanBank.repayLoan(amount);
      await tx.wait();
      alert("Loan repaid successfully!");
      setMessage("Loan repaid successfully!");
    } catch (error) {
      console.error(error);
      // Check if the error message includes "No active loan"
      if (
        error.data &&
        error.data.message &&
        error.data.message.includes("No active loan")
      ) {
        alert("No active loan found. Please ensure you have an active loan before repaying.");
        setMessage("No active loan found.");
      } else {
        alert("Loan repayment failed.");
        setMessage("Loan repayment failed.");
      }
    }
  }
  

  // FR5: Default Check (Public Bank)
  async function handleCheckDefault(e) {
    e.preventDefault();
    try {
      const tx = await loanBank.checkDefault(account);
      await tx.wait();
      alert("Default check completed! Notifications sent to Public Bank & Government Officer.");
      setMessage("Default check completed!");
    } catch (error) {
      console.error(error);
      alert("Default check failed.");
      setMessage("Default check failed.");
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Land & Loan Management</h1>
      <p>
        <strong>Connected Account:</strong> {account}
      </p>
      {govOfficer && (
        <p>
          <strong>Government Officer (Contract Owner):</strong> {govOfficer}
        </p>
      )}
      {message && <p>{message}</p>}

      <hr />
      <h2>Land Registration (Government Officer)</h2>
      {account && govOfficer && account.toLowerCase() === govOfficer.toLowerCase() ? (
        <form onSubmit={handleRegisterLand}>
          <div>
            <label>Plot ID: </label>
            <input
              type="number"
              value={regPlotId}
              onChange={(e) => setRegPlotId(e.target.value)}
              placeholder="Enter Plot ID"
              required
            />
          </div>
          <div>
            <label>Metadata: </label>
            <input
              type="text"
              value={regMetadata}
              onChange={(e) => setRegMetadata(e.target.value)}
              placeholder="Enter Metadata"
              required
            />
          </div>
          <div>
            <label>Owner Address: </label>
            <input
              type="text"
              value={regOwner}
              onChange={(e) => setRegOwner(e.target.value)}
              placeholder="Enter Owner Address"
              required
            />
          </div>
          <button type="submit">Register Land</button>
        </form>
      ) : (
        <p style={{ color: "red" }}>
          Only the Government Officer (contract owner) can register land.
        </p>
      )}

      <hr />
      <h2>Loan Application (Developer)</h2>
      <form onSubmit={handleApplyForLoan}>
        <div>
          <label>Principal (ETH): </label>
          <input
            type="number"
            value={loanPrincipal}
            onChange={(e) => setLoanPrincipal(e.target.value)}
            placeholder="Enter Principal"
            required
          />
        </div>
        <div>
          <label>Interest Rate (%): </label>
          <input
            type="number"
            step="0.1"
            value={loanInterest}
            onChange={(e) => setLoanInterest(e.target.value)}
            placeholder="Enter Interest Rate"
            required
          />
        </div>
        <button type="submit">Apply for Loan</button>
      </form>

      <hr />
      <h2>Land Purchase (Developer)</h2>
      <form onSubmit={handlePurchaseLand}>
        <div>
          <label>Plot ID: </label>
          <input
            type="number"
            value={purchasePlotId}
            onChange={(e) => setPurchasePlotId(e.target.value)}
            placeholder="Enter Plot ID to Purchase"
            required
          />
        </div>
        <button type="submit">Purchase Land</button>
      </form>

      <hr />
      <h2>Loan Repayment (Developer)</h2>
      <form onSubmit={handleRepayLoan}>
        <div>
          <label>Repayment Amount (ETH): </label>
          <input
            type="number"
            value={repayAmount}
            onChange={(e) => setRepayAmount(e.target.value)}
            placeholder="Enter Repayment Amount"
            required
          />
        </div>
        <button type="submit">Repay Loan</button>
      </form>

      <hr />
      <h2>Default Check (Public Bank)</h2>
      <button onClick={handleCheckDefault}>Check Default</button>
    </div>
  );
}

export default App;
