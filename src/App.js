import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import LandRegistryData from "./contracts/LandRegistry.json";
import LoanBankData from "./contracts/LoanBank.json";
import { registerLand } from './services/landRegistryServices';
import { applyLoan, repayLoan } from './services/loanBankService';

// Smart contract addresses
const landRegistryAddress = "0x74aF28Bc42C3967b00d72c59053F144207503607";
const loanBankAddress = "0x690c17B342043aC5682979D0a40f6ba6AE6d2Ca6";

// Extract ABIs from JSON artifacts
const landRegistryABI = LandRegistryData.abi;
const loanBankABI = LoanBankData.abi;

// Styling Objects
const containerStyle = {
  maxWidth: "800px",
  margin: "0 auto",
  padding: "20px",
  fontFamily: "'Inter', 'Roboto', sans-serif",
  backgroundColor: "rgba(255, 255, 255, 0.9)", 
  borderRadius: "12px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  position: "relative",
  zIndex: 1,
};

const headerStyle = {
  textAlign: "center",
  marginBottom: "30px",
  color: "#1a1a1a",
};

const formStyle = {
  backgroundColor: "#ffffff",
  padding: "20px",
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  marginBottom: "20px",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "15px",
  borderRadius: "6px",
  border: "1px solid #e2e8f0",
  fontSize: "16px",
  transition: "border-color 0.3s",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  backgroundColor: "#cc0001",
  color: "#ffffff",
  border: "none",
  borderRadius: "6px",
  fontSize: "16px",
  fontWeight: "500",
  cursor: "pointer",
  transition: "background-color 0.3s",
};

const messageStyle = (type) => ({
  padding: "10px",
  marginBottom: "20px",
  borderRadius: "6px",
  backgroundColor: type === "error" ? "#ffebee" : "#e8f5e9",
  color: type === "error" ? "#c62828" : "#2e7d32",
  border: `1px solid ${type === "error" ? "#c62828" : "#2e7d32"}`,
});

const loadingOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(255, 255, 255, 0.8)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const spinnerStyle = {
  border: "5px solid #f3f3f3",
  borderTop: "5px solid #cc0001",
  borderRadius: "50%",
  width: "50px",
  height: "50px",
  animation: "spin 1s linear infinite",
};

const backgroundStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundImage: "url('https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  zIndex: -1,
};

function App() {
  // Blockchain state
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [landRegistry, setLandRegistry] = useState(null);
  const [loanBank, setLoanBank] = useState(null);
  const [govOfficer, setGovOfficer] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success", "error", "info"
  const [isLoading, setIsLoading] = useState(false);

  // Form state for Land Registration
  const [regPlotId, setRegPlotId] = useState("");
  const [regMetadata, setRegMetadata] = useState("");
  const [regOwner, setRegOwner] = useState("");

  // Form state for Loan Application
  const [loanPrincipal, setLoanPrincipal] = useState("");
  const [loanInterest, setLoanInterest] = useState("");
  const [loanDeveloperAddress, setLoanDeveloperAddress] = useState("");

  // Form state for Loan Repayment
  const [repayAmount, setRepayAmount] = useState("");
  const [repayDeveloperAddress, setRepayDeveloperAddress] = useState("");

  // ---------------------------------------------
  // Load Blockchain Data
  // ---------------------------------------------
  useEffect(() => {
    async function loadBlockchainData() {
      if (window.ethereum) {
        setIsLoading(true);
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const signer = provider.getSigner();
          const account = await signer.getAddress();

          setAccount(account);
          setProvider(provider);
          setSigner(signer);

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

          const ownerAddress = await landRegistryContract.owner();
          setGovOfficer(ownerAddress);
          showMessage("Connected to blockchain system successfully", "success");
        } catch (error) {
          console.error("Error loading blockchain data:", error);
          showMessage("Error connecting to blockchain. Please check your MetaMask connection.", "error");
        } finally {
          setIsLoading(false);
        }
      } else {
        showMessage("Please install MetaMask to access services", "error");
      }
    }
    loadBlockchainData();
  }, []);

  // ---------------------------------------------
  // Helper: Show Message
  // ---------------------------------------------
  function showMessage(msg, type = "info") {
    setMessage(msg);
    setMessageType(type);
    if (type !== "error") {
      setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 5000);
    }
  }

  // ---------------------------------------------
  // Handlers for Functional Requirements
  // ---------------------------------------------

  // Land Registration
  async function handleRegisterLand(e) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const plotId = parseInt(regPlotId, 10);
      const enhancedMetadata = JSON.stringify({
        description: regMetadata,
        registrationDate: new Date().toISOString(),
      });

      const result = await registerLand(plotId, enhancedMetadata, regOwner);
      console.log("Backend logging result:", result);

      showMessage(`Land registered successfully! TX Hash: ${result.txHash}`, "success");
      setRegPlotId("");
      setRegMetadata("");
      setRegOwner("");
    } catch (error) {
      console.error("Error during registration:", error);
      showMessage("Land registration failed. Only authorized Government Officers can register property.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  // Loan Application
  async function handleApplyForLoan(e) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const principal = parseInt(loanPrincipal, 10);
      const interestRate = parseFloat(loanInterest);

      const result = await applyLoan(principal, interestRate, loanDeveloperAddress);
      console.log("Backend logging result:", result);

      showMessage(`Loan applied successfully! TX Hash: ${result.txHash}`, "success");
      setLoanPrincipal("");
      setLoanInterest("");
      setLoanDeveloperAddress("");
    } catch (error) {
      console.error(error);
      showMessage("Loan application failed. Please check your eligibility and try again.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  // Loan Repayment
  async function handleRepayLoan(e) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const amount = parseInt(repayAmount, 10);

      const result = await repayLoan(0, amount, repayDeveloperAddress); // Assuming loanIndex is 0
      console.log("Repayment result:", result);

      showMessage(`Loan repaid successfully! TX Hash: ${result.txHash}`, "success");
      setRepayAmount("");
      setRepayDeveloperAddress("");
    } catch (error) {
      console.error(error);
      showMessage("Loan repayment failed. Please check your account balance.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  // ---------------------------------------------
  // Main Render
  // ---------------------------------------------
  return (
    <div>
      {/* Background Image */}
      <div style={backgroundStyle}></div>

      {/* Main Content */}
      <div style={containerStyle}>
        <h1 style={headerStyle}>Land and Loan Management System</h1>

        {/* Display connection status */}
        {account ? (
          <p style={{ textAlign: "center", color: "#4caf50" }}>Connected Account: {account}</p>
        ) : (
          <p style={{ textAlign: "center", color: "#f44336" }}>Not connected to MetaMask</p>
        )}

        {/* Display messages */}
        {message && (
          <div style={messageStyle(messageType)}>
            {message}
          </div>
        )}

        {/* Land Registration Form */}
        <div style={formStyle}>
          <h2>Land Registration</h2>
          <form onSubmit={handleRegisterLand}>
            <input
              type="number"
              placeholder="Plot ID"
              value={regPlotId}
              onChange={(e) => setRegPlotId(e.target.value)}
              style={inputStyle}
              required
            />
            <input
              type="text"
              placeholder="Metadata"
              value={regMetadata}
              onChange={(e) => setRegMetadata(e.target.value)}
              style={inputStyle}
              required
            />
            <input
              type="text"
              placeholder="Owner Address"
              value={regOwner}
              onChange={(e) => setRegOwner(e.target.value)}
              style={inputStyle}
              required
            />
            <button type="submit" style={buttonStyle}>
              Register Land
            </button>
          </form>
        </div>

        {/* Loan Application Form */}
        <div style={formStyle}>
          <h2>Loan Application</h2>
          <form onSubmit={handleApplyForLoan}>
            <input
              type="number"
              placeholder="Principal"
              value={loanPrincipal}
              onChange={(e) => setLoanPrincipal(e.target.value)}
              style={inputStyle}
              required
            />
            <input
              type="number"
              step="0.1"
              placeholder="Interest Rate"
              value={loanInterest}
              onChange={(e) => setLoanInterest(e.target.value)}
              style={inputStyle}
              required
            />
            <input
              type="text"
              placeholder="Developer Address"
              value={loanDeveloperAddress}
              onChange={(e) => setLoanDeveloperAddress(e.target.value)}
              style={inputStyle}
              required
            />
            <button type="submit" style={buttonStyle}>
              Apply for Loan
            </button>
          </form>
        </div>

        {/* Loan Repayment Form */}
        <div style={formStyle}>
          <h2>Loan Repayment</h2>
          <form onSubmit={handleRepayLoan}>
            <input
              type="number"
              placeholder="Repayment Amount"
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
              style={inputStyle}
              required
            />
            <input
              type="text"
              placeholder="Developer Address"
              value={repayDeveloperAddress}
              onChange={(e) => setRepayDeveloperAddress(e.target.value)}
              style={inputStyle}
              required
            />
            <button type="submit" style={buttonStyle}>
              Repay Loan
            </button>
          </form>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div style={loadingOverlayStyle}>
            <div style={spinnerStyle}></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

/*
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import LandRegistryData from "./contracts/LandRegistry.json";
import LoanBankData from "./contracts/LoanBank.json";
import { registerLand } from './services/landRegistryServices';
import { applyLoan } from './services/loanBankService';
import { fetchLoansForAccount } from './services/loanBankService';
import {fetchAllLoans} from './services/loanBankService';
import {repayLoan} from './services/loanBankService';


// Extract ABIs from JSON artifacts
const landRegistryABI = LandRegistryData.abi;
const loanBankABI = LoanBankData.abi;

// Smart contract addresses
const landRegistryAddress = "0x74aF28Bc42C3967b00d72c59053F144207503607";
const loanBankAddress = "0x690c17B342043aC5682979D0a40f6ba6AE6d2Ca6";

// Styling Objects (Define these outside or at the top of your component)
const containerStyle = {
  fontFamily: "'Inter', 'Roboto', sans-serif",
  maxWidth: "1200px",
  margin: "20px auto",
  padding: "30px",
  background: "#f8f9fa",
  borderRadius: "12px",
  boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
  position: "relative",
  zIndex: 10
};

const headerStyle = {
  textAlign: "center",
  marginBottom: "30px"
};

const sectionStyle = {
  background: "#ffffff",
  padding: "25px",
  marginBottom: "25px",
  borderRadius: "10px",
  boxShadow: "0 3px 8px rgba(0,0,0,0.08)",
  borderLeft: "5px solid #cc0001"
};

const formGroupStyle = { marginBottom: "18px" };

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  color: "#444",
  fontWeight: "500"
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "6px",
  border: "1px solid #ddd",
  fontSize: "16px",
  transition: "border-color 0.3s"
};

const selectStyle = {
  ...inputStyle,
  height: "48px",
  backgroundColor: "#fff"
};

const buttonStyle = {
  padding: "12px 24px",
  background: "#cc0001",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  marginRight: "12px",
  fontSize: "16px",
  fontWeight: "500",
  transition: "background 0.3s"
};

const secondaryButtonStyle = { ...buttonStyle, background: "#718093" };

const navButtonContainerStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "15px",
  marginTop: "30px"
};

const messageContainerStyle = {
  padding: "12px 20px",
  borderRadius: "8px",
  marginBottom: "20px",
  fontSize: "16px",
  fontWeight: "500",
  backgroundColor: "#d4edda",
  color: "#155724",
  border: "1px solid #c3e6cb",
};

const accountInfoStyle = {
  background: "#e2e8f0",
  padding: "15px",
  borderRadius: "8px",
  marginBottom: "25px",
  fontSize: "14px"
};

const tabsContainerStyle = {
  display: "flex",
  marginBottom: "25px",
  borderBottom: "1px solid #ddd",
  overflowX: "auto"
};

const tabStyle = (isActive) => ({
  padding: "12px 24px",
  cursor: "pointer",
  borderBottom: isActive ? "3px solid #cc0001" : "none",
  color: isActive ? "#cc0001" : "#718093",
  fontWeight: isActive ? "600" : "400",
  transition: "all 0.3s"
});

const loadingOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(255, 255, 255, 0.8)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000
};

const spinnerStyle = {
  border: "5px solid #f3f3f3",
  borderTop: "5px solid #cc0001",
  borderRadius: "50%",
  width: "50px",
  height: "50px",
  animation: "spin 1s linear infinite"
};

const userGroupStyle = {
  marginBottom: "15px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  fontSize: "16px"
};

// SingaporeHDBBackground Component
const SingaporeHDBBackground = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 1200 800" 
    style={{ width: "100%", height: "100%" }}
    preserveAspectRatio="xMidYMid slice"
  >
    <rect width="1200" height="800" fill="#87CEEB" />
    <rect x="0" y="500" width="1200" height="300" fill="#E6E6FA" />
    <rect x="50" y="350" width="200" height="400" fill="#F0F8FF" stroke="#4682B4" strokeWidth="5" />
    <rect x="300" y="300" width="250" height="450" fill="#E0FFFF" stroke="#48D1CC" strokeWidth="5" />
    <rect x="600" y="375" width="200" height="375" fill="#F0FFF0" stroke="#3CB371" strokeWidth="5" />
    <rect x="900" y="325" width="250" height="425" fill="#FFF0F5" stroke="#FF69B4" strokeWidth="5" />
    {[50, 300, 600, 900].map((x, buildingIndex) => (
      Array.from({ length: 10 }, (_, i) => (
        Array.from({ length: 5 }, (_, j) => (
          <rect 
            key={`window-${buildingIndex}-${i}-${j}`} 
            x={x + 20 + (j * 40)} 
            y={400 + (i * 30)} 
            width="30" 
            height="20" 
            fill="#FFFFFF" 
            stroke="#4169E1" 
            strokeWidth="2" 
          />
        ))
      ))
    ))}
  </svg>
);

function App() {
  // ---------------------------
  // USER GROUP STATE: "governmentOfficer", "developer", "bank"
  // ---------------------------

  const [userGroup, setUserGroup] = useState("developer");

  // Blockchain state
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [landRegistry, setLandRegistry] = useState(null);
  const [loanBank, setLoanBank] = useState(null);
  const [govOfficer, setGovOfficer] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success", "error", "info"

  // Form state for Land Registration (FR1)
  const [regPlotId, setRegPlotId] = useState("");
  const [regMetadata, setRegMetadata] = useState("");
  const [regOwner, setRegOwner] = useState("");
  const [regType, setRegType] = useState("HDB");
  const [regTown, setRegTown] = useState("Ang Mo Kio");

  // Form state for Loan Application (FR2)
  const [loanPrincipal, setLoanPrincipal] = useState("");
  const [loanInterest, setLoanInterest] = useState("");
  const [loanTerm, setLoanTerm] = useState("25");
  const [loanType, setLoanType] = useState("HDB");
  const [loanDeveloperAddress, setLoanDeveloperAddress] = useState("");
  const [repayDeveloperAddress, setRepayDeveloperAddress] = useState("");


  // Form state for Land Purchase (FR3)
  const [purchasePlotId, setPurchasePlotId] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");

  // Form state for Loan Repayment (FR4)
  const [repayAmount, setRepayAmount] = useState("");
  const [repaymentMethod, setRepaymentMethod] = useState("CPF");
  const [repayLoanIndex, setRepayLoanIndex] = useState("");

  // State for existing loanss
  const [loans, setLoans] = useState([]);

  // State for default check
  const [defaultCheckAddress, setDefaultCheckAddress] = useState("");
  const [defaultCheckResult, setDefaultCheckResult] = useState("");

  // Navigation state
  const [currentPage, setCurrentPage] = useState("landRegistration");
  const [isLoading, setIsLoading] = useState(false);

  // HDB towns and types
  const hdbTowns = [
    "Ang Mo Kio", "Bedok", "Bishan", "Bukit Batok", "Bukit Merah",
    "Bukit Panjang", "Bukit Timah", "Central Area", "Choa Chu Kang",
    "Clementi", "Geylang", "Hougang", "Jurong East", "Jurong West",
    "Kallang/Whampoa", "Marine Parade", "Pasir Ris", "Punggol",
    "Queenstown", "Sembawang", "Sengkang", "Serangoon", "Tampines",
    "Tengah", "Toa Payoh", "Woodlands", "Yishun"
  ];
  const hdbTypes = [
    "2-Room Flexi", "3-Room", "4-Room", "5-Room", "Executive",
    "Studio Apartment", "DBSS", "Executive Condominium"
  ];

  // ---------------------------------------------
  // Load Blockchain Data
  // ---------------------------------------------
  useEffect(() => {
    async function loadBlockchainData() {
      if (window.ethereum) {
        setIsLoading(true);
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const signer = provider.getSigner();
          const account = await signer.getAddress();
          setAccount(account);
          setProvider(provider);
          setSigner(signer);

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

          try {
            const ownerAddress = await landRegistryContract.owner();
            setGovOfficer(ownerAddress);
            showMessage("Connected to blockchain system successfully", "success");
          } catch (error) {
            console.error("Owner() call failed:", error);
            setGovOfficer(null);
            showMessage("Connected, but couldn't verify Government Officer role", "info");
          }
        } catch (error) {
          console.error("Error loading blockchain data:", error);
          showMessage("Error connecting to blockchain. Please check your MetaMask connection.", "error");
        } finally {
          setIsLoading(false);
        }
      } else {
        showMessage("Please install MetaMask to access services", "error");
      }
    }
    loadBlockchainData();
  }, []);

  async function fetchLoans() {
    console.log("Fetching loans for account", account);
    if (!account) return;
    try {
      const data = await fetchAllLoans();
      console.log("Loans fetched:", data);
      setLoans(data);
    } catch (error) {
      console.error("Error fetching loans:", error);
    }
  }

  useEffect(() => {
    if (currentPage === "loanRepayment" && account) {
      fetchLoans();
    }
  }, [currentPage, account]);
  
  async function handleCheckDefault(e) {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!defaultCheckAddress) {
        showMessage("Please enter a developer address.", "error");
        setIsLoading(false);
        return;
      }
  
      // Check loans in the smart contract
      const fetchedLoans = await fetchLoansForAccount(defaultCheckAddress);
      if (fetchedLoans.length === 0) {
        showMessage("No loans found for this developer address.", "error");
        setIsLoading(false);
        return;
      }
  
      let defaultedLoanIndex = -1;
      for (let i = 0; i < fetchedLoans.length; i++) {
        if (fetchedLoans[i].isActive && fetchedLoans[i].balance > 0) {
          // Found a loan that can be defaulted
          defaultedLoanIndex = i;
          break;
        }
      }
  
      if (defaultedLoanIndex === -1) {
        showMessage("No defaulted loans found for this developer.", "success");
        setDefaultCheckResult("No defaulted loans.");
        setIsLoading(false);
        return;
      }
  
      // Call the smart contract function to check for default
      const tx = await loanBank.checkDefault(defaultCheckAddress, defaultedLoanIndex);
      await tx.wait();
  
      showMessage("Loan default check completed. Notifications sent if applicable.", "success");
      setDefaultCheckResult(`Defaulted loan at index ${defaultedLoanIndex}.`);
    } catch (error) {
      console.error("Error checking loan default:", error);
      showMessage("Loan default check failed. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  // ---------------------------------------------
  // Helper: Show Message
  // ---------------------------------------------
  function showMessage(msg, type = "info") {
    setMessage(msg);
    setMessageType(type);
    if (type !== "error") {
      setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 5000);
    }
  }

  // ---------------------------------------------
  // Handlers for Functional Requirements
  // ---------------------------------------------
  
  // Land Registration
  async function handleRegisterLand(e) {
    e.preventDefault();
    console.log("handleRegisterLand triggered");
    setIsLoading(true);
    try {
      const plotId = parseInt(regPlotId, 10);
      console.log("Parsed plotId:", plotId);
      const enhancedMetadata = JSON.stringify({
        description: regMetadata,
        town: regTown,
        flatType: regType,
        registrationDate: new Date().toISOString()
      });
      console.log("Enhanced metadata:", enhancedMetadata);
      
      const result = await registerLand(plotId, enhancedMetadata, regOwner);
      console.log("Backend logging result:", result);
      
      showMessage(`Unit ${regType} in ${regTown} registered successfully with NFT issuance`, "success");
      setRegPlotId("");
      setRegMetadata("");
    } catch (error) {
      console.error("Error during registration:", error);
      if (error.message && error.message.includes("Land already registered")) {
        showMessage("Registration failed: This land unit is already registered.", "error");
      } else {
        showMessage("Land registration failed. Only authorized Government Officers can register property.", "error");
      }
    } finally {
      setIsLoading(false);
      console.log("handleRegisterLand completed");
    }
  }

  // Loan Application
  async function handleApplyForLoan(e) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const principal = parseInt(loanPrincipal, 10);
      const interestRate = Math.round(parseFloat(loanInterest) * 100);
      console.log({
        loanType,
        loanTerm,
        applicant: account,
        developerAddress: loanDeveloperAddress,
        applicationDate: new Date().toISOString()
      });
      const result = await applyLoan(principal, interestRate, loanDeveloperAddress);
      console.log("Backend logging result:", result);

      showMessage(`${loanType} loan application for $${principal} submitted successfully. Awaiting bank approval.`, "success");
      setLoanPrincipal("");
      setLoanInterest("");
      setLoanDeveloperAddress("");
    } catch (error) {
      console.error(error);
      showMessage("Loan application failed. Please check your eligibility and try again.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  // Land Purchase
  async function handlePurchaseLand(e) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const plotId = parseInt(purchasePlotId, 10);
      console.log({
        plotId,
        purchasePrice,
        purchaseDate: new Date().toISOString(),
        buyer: account
      });
      const tx = await landRegistry.purchaseLand(plotId);
      await tx.wait();
      showMessage(`Land unit #${plotId} purchased successfully! Ownership transferred to your account.`, "success");
      setPurchasePlotId("");
      setPurchasePrice("");
    } catch (error) {
      console.error(error);
      showMessage("Property purchase failed. Please verify the unit is available for sale.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  // Loan Repayment
  async function handleRepayLoan(e) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const amount = parseInt(repayAmount, 10);
      console.log({
        repaymentMethod,
        amount,
        repaymentDate: new Date().toISOString(),
        payer: account,
        repayDeveloperAddress
      });

      // Fetch loans for the manually entered developer address
      const fetchedLoans = await fetchLoansForAccount(repayDeveloperAddress);
      console.log("Fetched loans:", fetchedLoans);
      // Find the first active loan for that address
      const activeLoanIndex = fetchedLoans.findIndex((loan) => loan.isActive);
      if (activeLoanIndex === -1) {
        showMessage("No active loan found for this developer address.", "error");
        setIsLoading(false);
        return;
      }
      // Call the service function to repay the loan using the found index
      const result = await repayLoan(activeLoanIndex, amount, repayDeveloperAddress);
      console.log("Repayment result:", result);
      showMessage(`Loan repayment of $${amount} via ${repaymentMethod} processed successfully!`, "success");
      setRepayAmount("");

      // Refresh loans after repayment
      await fetchLoans();

    } catch (error) {
      console.error(error);
      if (error.data && error.data.message && error.data.message.includes("No active loan")) {
        showMessage("No active loan found. Please ensure you have an active loan before repaying.", "error");
      } else {
        showMessage("Loan repayment failed. Please check your account balance.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  }
  
  // Navigation Functions
  function goToNextPage() {
    if (currentPage === "landRegistration") setCurrentPage("loanApplication");
    else if (currentPage === "loanApplication") setCurrentPage("landPurchase");
    else if (currentPage === "landPurchase") setCurrentPage("loanRepayment");
    else if (currentPage === "loanRepayment") setCurrentPage("defaultCheck");
  }

  function goToPreviousPage() {
    if (currentPage === "defaultCheck") setCurrentPage("loanRepayment");
    else if (currentPage === "loanRepayment") setCurrentPage("landPurchase");
    else if (currentPage === "landPurchase") setCurrentPage("loanApplication");
    else if (currentPage === "loanApplication") setCurrentPage("landRegistration");
  }

  // Tabs Based on User Group
  function getAvailableTabs() {
    if (userGroup === "governmentOfficer") {
      return { landRegistration: "Land Registration" };
    }
    if (userGroup === "developer") {
      return {
        loanApplication: "Land Loan Application",
        landPurchase: "Land Purchase",
        loanRepayment: "Loan Repayment"
      };
    }
    if (userGroup === "bank") {
      return { defaultCheck: "Default Verification" };
    }
    return {
      loanApplication: "Land Loan Application",
      landPurchase: "Land Purchase",
      loanRepayment: "Loan Repayment"
    };
  }

  useEffect(() => {
    const availableTabs = getAvailableTabs();
    const keys = Object.keys(availableTabs);
    if (keys.length > 0 && !keys.includes(currentPage)) {
      setCurrentPage(keys[0]);
    }
  }, [userGroup]);


  function renderTabs() {
    const availableTabs = getAvailableTabs();
    const tabEntries = Object.entries(availableTabs);
    // if (!Object.keys(availableTabs).includes(currentPage)) {
    //   setCurrentPage(tabEntries[0][0]);
    // }
    return (
      <div style={tabsContainerStyle}>
        {tabEntries.map(([page, title]) => (
          <div
            key={page}
            style={tabStyle(currentPage === page)}
            onClick={() => setCurrentPage(page)}
          >
            {title}
          </div>
        ))}
      </div>
    );
  }

  // Render Existing Loans Section
  function renderLoans() {
    return (
      <div style={{ marginBottom: "30px" }}>
        <h3>Your Loans</h3>
        {loans.length === 0 ? (
          <p>No loans found.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>Developer Address</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>Principal (SGD)</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>Interest Rate (%)</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>Outstanding Balance</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan, index) => (
                <tr key={index}>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{loan.loanDeveloperAddress}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{loan.principal}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{loan.interestRate}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{loan.balance}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {loan.isActive ? "Active" : "Repaid"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  // Render Page Content Based on Current Tab
  function renderPageContent() {
    switch (currentPage) {
      case "landRegistration":
        return renderLandRegistration();
      case "loanApplication":
        return renderLoanApplication();
      case "landPurchase":
        return renderLandPurchase();
      case "loanRepayment":
        return (
          <>
            {renderLoans()}
            {renderLoanRepayment()}
          </>
        );
      case "defaultCheck":
        return renderDefaultCheck();
      default:
        return <div>Page not found</div>;
    }
  }

  function renderLandPurchase() {
    return (
      <div style={sectionStyle}>
        <h2>Land Unit Purchase</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          Purchase land units with secure blockchain verification of ownership transfer.
        </p>
        <form onSubmit={handlePurchaseLand}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Land Unit Number / Plot ID</label>
            <input
              type="number"
              value={purchasePlotId}
              onChange={(e) => setPurchasePlotId(e.target.value)}
              placeholder="Enter the land unit number to purchase"
              style={inputStyle}
              required
            />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Purchase Price (SGD)</label>
            <input
              type="number"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              placeholder="Enter the purchase price"
              style={inputStyle}
              required
            />
          </div>
          <div style={{ background: "#e2f7e2", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
            <p style={{ margin: 0, color: "#2d632d" }}>
              <strong>Note:</strong> Purchasing this land unit will transfer the NFT ownership to your wallet.
              Make sure you have sufficient funds and approvals in place.
            </p>
          </div>
          <button type="submit" style={buttonStyle}>
            Complete Purchase Transaction
          </button>
        </form>
      </div>
    );
  }

  // Separate render function for Loan Repayment Form
  function renderLoanRepayment() {
    return (
      <div style={sectionStyle}>
        <h2>Land Loan Repayment</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          Make secure loan repayments towards your land loan.
        </p>
        <form onSubmit={handleRepayLoan}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Developer Address</label>
            <input
              type="text"
              value={repayDeveloperAddress}
              onChange={(e) => setRepayDeveloperAddress(e.target.value)}
              placeholder="Enter Developer Address"
              style={inputStyle}
              required
            />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Repayment Method</label>
            <select
              value={repaymentMethod}
              onChange={(e) => setRepaymentMethod(e.target.value)}
              style={selectStyle}
              required
            >
              <option value="CPF">CPF Ordinary Account</option>
              <option value="Cash">Cash</option>
              <option value="GIRO">GIRO</option>
              <option value="Bank">Bank Transfer</option>
            </select>
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Repayment Amount (SGD)</label>
            <input
              type="number"
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
              placeholder="Enter repayment amount"
              style={inputStyle}
              required
            />
          </div>
          <button type="submit" style={buttonStyle}>
            Process Repayment
          </button>
        </form>
      </div>
    );
  }

  // Render Land Registration Form
  function renderLandRegistration() {
    return (
      <div style={sectionStyle}>
        <h2>Land Registration (Officer Only)</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          Register new land units and assign ownership through secure blockchain NFTs.
        </p>
        {account &&
        govOfficer &&
        account.toLowerCase() === govOfficer.toLowerCase() ? (
          <form onSubmit={handleRegisterLand}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Land Number / Plot ID</label>
              <input
                type="number"
                value={regPlotId}
                onChange={(e) => setRegPlotId(e.target.value)}
                placeholder="Enter Land Number"
                style={inputStyle}
                required
              />
            </div>
            <div style={{ display: "flex", gap: "20px" }}>
              <div style={{ ...formGroupStyle, flex: 1 }}>
                <label style={labelStyle}>HDB Town</label>
                <select
                  value={regTown}
                  onChange={(e) => setRegTown(e.target.value)}
                  style={selectStyle}
                  required
                >
                  {hdbTowns.map((town) => (
                    <option key={town} value={town}>
                      {town}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ ...formGroupStyle, flex: 1 }}>
                <label style={labelStyle}>Flat Type</label>
                <select
                  value={regType}
                  onChange={(e) => setRegType(e.target.value)}
                  style={selectStyle}
                  required
                >
                  {hdbTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Property Details</label>
              <input
                type="text"
                value={regMetadata}
                onChange={(e) => setRegMetadata(e.target.value)}
                placeholder="Enter details (e.g. floor area, block number, storey)"
                style={inputStyle}
                required
              />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Registered Owner's Address</label>
              <input
                type="text"
                value={regOwner}
                onChange={(e) => setRegOwner(e.target.value)}
                placeholder="Enter owner's Ethereum address"
                style={inputStyle}
                required
              />
            </div>
            <button type="submit" style={buttonStyle}>
              Register Land Unit & Issue NFT
            </button>
          </form>
        ) : (
          <div style={{ color: "#721c24", background: "#f8d7da", padding: "15px", borderRadius: "5px" }}>
            <p>
              <strong>Access Restricted:</strong> Only authorized Government Officers can register units.
            </p>
            <p style={{ marginTop: "10px" }}>
              Please login with the appropriate credentials to access this function.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Render Loan Application Form
  function renderLoanApplication() {
    return (
      <div style={sectionStyle}>
        <h2>Land Loan Application</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          Apply for land loans with competitive interest rates and flexible terms.
        </p>
        <form onSubmit={handleApplyForLoan}>
          <div style={{ display: "flex", gap: "20px" }}>
            <div style={{ ...formGroupStyle, flex: 1 }}>
              <label style={labelStyle}>Loan Type</label>
              <select
                value={loanType}
                onChange={(e) => setLoanType(e.target.value)}
                style={selectStyle}
                required
              >
                <option value="HDB">Land Loan</option>
                <option value="Bank">Bank Loan</option>
                <option value="BTO">BTO Financing</option>
                <option value="Resale">Resale Land Loan</option>
              </select>
            </div>
            <div style={{ ...formGroupStyle, flex: 1 }}>
              <label style={labelStyle}>Loan Term (Years)</label>
              <select
                value={loanTerm}
                onChange={(e) => setLoanTerm(e.target.value)}
                style={selectStyle}
                required
              >
                <option value="5">5 years</option>
                <option value="10">10 years</option>
                <option value="15">15 years</option>
                <option value="20">20 years</option>
                <option value="25">25 years</option>
                <option value="30">30 years</option>
              </select>
            </div>
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Loan Amount (SGD)</label>
            <input
              type="number"
              value={loanPrincipal}
              onChange={(e) => setLoanPrincipal(e.target.value)}
              placeholder="Enter loan principal amount"
              style={inputStyle}
              required
            />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Interest Rate (%)</label>
            <input
              type="number"
              step="0.1"
              value={loanInterest}
              onChange={(e) => setLoanInterest(e.target.value)}
              placeholder="Enter interest rate"
              style={inputStyle}
              required
            />
            <small style={{ color: "#666", marginTop: "5px", display: "block" }}>
              Concessionary loan rate is currently 2.6% p.a.
            </small>
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Developer Address</label>
            <input
              type="text"
              value={loanDeveloperAddress}
              onChange={(e) => setLoanDeveloperAddress(e.target.value)}
              placeholder="Enter your Ethereum address"
              style={inputStyle}
              required
            />
          </div>
          <button type="submit" style={buttonStyle}>
            Submit Loan Application
          </button>
        </form>
      </div>
    );
  }

  // Render Default Check
function renderDefaultCheck() {
  return (
    <div style={sectionStyle}>
      <h2>Loan Default Verification (Bank Use)</h2>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        Bank officers can verify loan status and check for defaults. Notifications will be sent to relevant parties.
      </p>
      <div style={formGroupStyle}>
        <label style={labelStyle}>Developer Address</label>
        <input
          type="text"
          value={defaultCheckAddress}
          onChange={(e) => setDefaultCheckAddress(e.target.value)}
          placeholder="Enter Developer Address"
          style={inputStyle}
          required
        />
      </div>
      <button onClick={handleCheckDefault} style={buttonStyle}>
        Verify Loan Status
      </button>
      {defaultCheckResult && (
        <div style={{ marginTop: "15px", color: "#333", fontWeight: "500" }}>
          {defaultCheckResult}
        </div>
      )}
    </div>
  );
}

  // ---------------------------------------------
  // Main Render
  // ---------------------------------------------
  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100vh", background: "#fff" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, zIndex: 0 }}>
        <SingaporeHDBBackground />
      </div>
      <div style={containerStyle}>
        <div style={{ ...loadingOverlayStyle, display: isLoading ? "flex" : "none" }}>
          <div style={spinnerStyle}></div>
        </div>
  
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
            <svg width="60" height="60" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <rect x="10" y="10" width="80" height="80" rx="10" ry="10" stroke="#cc0001" strokeWidth="5" fill="white" />
              <polygon points="50,20 20,50 35,50 35,75 65,75 65,50 80,50" fill="#cc0001" />
              <rect x="45" y="50" width="10" height="25" fill="white" />
            </svg>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#000" }}>
              Government Land System
            </h1>
          </div>
          <div style={userGroupStyle}>
            <label htmlFor="userGroup"><strong>User Group:</strong></label>
            <select
              id="userGroup"
              value={userGroup}
              onChange={(e) => setUserGroup(e.target.value)}
              style={{ padding: "8px", fontSize: "16px" }}
            >
              <option value="governmentOfficer">Government Officer</option>
              <option value="developer">Developer</option>
              <option value="bank">Bank</option>
            </select>
          </div>
        </div>
  
        <div style={accountInfoStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>Connected Account:</strong>{" "}
              {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : "Not connected"}
              {govOfficer && account && govOfficer.toLowerCase() === account.toLowerCase() && (
                <span style={{ marginLeft: "10px", background: "#cc0001", color: "white", padding: "3px 8px", borderRadius: "4px", fontSize: "12px" }}>
                  Government Officer
                </span>
              )}
            </div>
            <div>
              <span style={{
                display: "inline-block",
                width: "10px",
                height: "10px",
                backgroundColor: account ? "#4cd137" : "#718093",
                borderRadius: "50%",
                marginRight: "5px"
              }}></span>
              {account ? "Connected to Blockchain" : "Disconnected"}
            </div>
          </div>
        </div>
  
        {message && <div style={messageContainerStyle}>{message}</div>}
  
        {renderTabs()}
  
        {renderPageContent()}
  
        <div style={navButtonContainerStyle}>
          <button onClick={goToPreviousPage} style={secondaryButtonStyle}>
            Previous
          </button>
          <button onClick={goToNextPage} style={buttonStyle}>
            Next
          </button>
        </div>
  
        <div style={{ marginTop: "40px", textAlign: "center", color: "#718093", fontSize: "14px" }}>
          <p>Government Land System © {new Date().getFullYear()}</p>
          <p>Secured by Blockchain Technology</p>
        </div>
      </div>
    </div>
  );
}

export default App;

*/
