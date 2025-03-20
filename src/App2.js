import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import LandRegistryData from "./contracts/LandRegistry.json";
import LoanBankData from "./contracts/LoanBank.json";

// Extract ABIs from the JSON artifacts
const landRegistryABI = LandRegistryData.abi;
const loanBankABI = LoanBankData.abi;

// Smart contract addresses (update if needed)
const landRegistryAddress = "0x0C82942eBb22F1687Fd1D973c54087EA747f5fb7";
const loanBankAddress = "0x7Eec146e9B80cEc4e474304c59356FB583952b3b";

// SingaporeHDBBackground Component – renders a full-page scenic SVG background
const SingaporeHDBBackground = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 1200 800" 
    style={{ width: "100%", height: "100%" }}
    preserveAspectRatio="xMidYMid slice"
  >
    {/* Sky */}
    <rect width="1200" height="800" fill="#87CEEB"/>
    
    {/* Background HDB Buildings */}
    <rect x="0" y="500" width="1200" height="300" fill="#E6E6FA"/>
    
    {/* Multiple HDB Blocks */}
    <rect x="50" y="350" width="200" height="400" fill="#F0F8FF" stroke="#4682B4" strokeWidth="5"/>
    <rect x="300" y="300" width="250" height="450" fill="#E0FFFF" stroke="#48D1CC" strokeWidth="5"/>
    <rect x="600" y="375" width="200" height="375" fill="#F0FFF0" stroke="#3CB371" strokeWidth="5"/>
    <rect x="900" y="325" width="250" height="425" fill="#FFF0F5" stroke="#FF69B4" strokeWidth="5"/>
    
    {/* Windows */}
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
  // Blockchain state
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [landRegistry, setLandRegistry] = useState(null);
  const [loanBank, setLoanBank] = useState(null);
  const [govOfficer, setGovOfficer] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // success, error, info

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

  // Form state for Land Purchase (FR3)
  const [purchasePlotId, setPurchasePlotId] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");

  // Form state for Loan Repayment (FR4)
  const [repayAmount, setRepayAmount] = useState("");
  const [repaymentMethod, setRepaymentMethod] = useState("CPF");

  // Navigation state
  const [currentPage, setCurrentPage] = useState("landRegistration");
  const [isLoading, setIsLoading] = useState(false);

  // HDB towns in Singapore
  const hdbTowns = [
    "Ang Mo Kio", "Bedok", "Bishan", "Bukit Batok", "Bukit Merah", 
    "Bukit Panjang", "Bukit Timah", "Central Area", "Choa Chu Kang", 
    "Clementi", "Geylang", "Hougang", "Jurong East", "Jurong West", 
    "Kallang/Whampoa", "Marine Parade", "Pasir Ris", "Punggol", 
    "Queenstown", "Sembawang", "Sengkang", "Serangoon", "Tampines", 
    "Tengah", "Toa Payoh", "Woodlands", "Yishun"
  ];

  // HDB flat types
  const hdbTypes = [
    "2-Room Flexi", "3-Room", "4-Room", "5-Room", "Executive", 
    "Studio Apartment", "DBSS", "Executive Condominium"
  ];

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

          // Retrieve contract owner (HDB Officer)
          try {
            const ownerAddress = await landRegistryContract.owner();
            setGovOfficer(ownerAddress);
            showMessage("Connected to URA blockchain system successfully", "success");
          } catch (error) {
            console.error("Owner() call failed:", error);
            setGovOfficer(null);
            showMessage("Connected, but couldn't verify URA Officer role", "info");
          }
        } catch (error) {
          console.error("Error loading blockchain data:", error);
          showMessage("Error connecting to URA blockchain. Please check your MetaMask connection.", "error");
        } finally {
          setIsLoading(false);
        }
      } else {
        showMessage("Please install MetaMask to access URA services", "error");
      }
    }
    loadBlockchainData();
  }, []);

  // Helper: Show message with type
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

  // Handler: Land Registration (FR1)
  async function handleRegisterLand(e) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const plotId = parseInt(regPlotId, 10);
      const enhancedMetadata = JSON.stringify({
        description: regMetadata,
        town: regTown,
        flatType: regType,
        registrationDate: new Date().toISOString()
      });
      
      const tx = await landRegistry.registerLand(plotId, enhancedMetadata, regOwner);
      await tx.wait();
      showMessage(`Unit ${regType} in ${regTown} registered successfully with NFT issuance`, "success");
      setRegPlotId("");
      setRegMetadata("");
    } catch (error) {
      console.error(error);
      showMessage("Land registration failed. Only authorized URA Officers can register property.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  // Handler: Loan Application (FR2)
  async function handleApplyForLoan(e) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const principal = parseInt(loanPrincipal, 10);
      const interestRate = parseFloat(loanInterest);
      console.log({
        loanType,
        loanTerm,
        applicant: account,
        applicationDate: new Date().toISOString()
      });
      
      const tx = await loanBank.createLoan(principal, interestRate);
      await tx.wait();
      showMessage(`${loanType} loan application for $${principal} submitted successfully. Awaiting bank approval.`, "success");
      setLoanPrincipal("");
      setLoanInterest("");
    } catch (error) {
      console.error(error);
      showMessage("Loan application failed. Please check your eligibility and try again.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  // Handler: Land Purchase (FR3)
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

  // Handler: Loan Repayment (FR4)
  async function handleRepayLoan(e) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const amount = parseInt(repayAmount, 10);
      console.log({
        repaymentMethod,
        amount,
        repaymentDate: new Date().toISOString(),
        payer: account
      });
      
      const tx = await loanBank.repayLoan(amount);
      await tx.wait();
      showMessage(`Loan repayment of $${amount} via ${repaymentMethod} processed successfully!`, "success");
      setRepayAmount("");
    } catch (error) {
      console.error(error);
      if (
        error.data &&
        error.data.message &&
        error.data.message.includes("No active loan")
      ) {
        showMessage("No active Land loan found. Please ensure you have an active loan before repaying.", "error");
      } else {
        showMessage("Loan repayment failed. Please check your account balance.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Handler: Default Check (FR5)
  async function handleCheckDefault(e) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const tx = await loanBank.checkDefault(account);
      await tx.wait();
      showMessage("Default check completed! Notifications sent to Public Bank & URA Officer.", "success");
    } catch (error) {
      console.error(error);
      showMessage("Default check failed. Please try again later.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  // Navigation functions
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

  // Styling objects with updated red color (#cc0001)
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

  // Instead of a plain <h1>, we create a styled brand header
  const headerStyle = {
    textAlign: "center",
    marginBottom: "30px",
  };

  const sectionStyle = {
    background: "#ffffff",
    padding: "25px",
    marginBottom: "25px",
    borderRadius: "10px",
    boxShadow: "0 3px 8px rgba(0,0,0,0.08)",
    borderLeft: "5px solid #cc0001", // red accent
  };

  const formGroupStyle = { marginBottom: "18px" };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    color: "#444",
    fontWeight: "500",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "16px",
    transition: "border-color 0.3s",
  };

  const selectStyle = {
    ...inputStyle,
    height: "48px",
    backgroundColor: "#fff",
  };

  const buttonStyle = {
    padding: "12px 24px",
    background: "#cc0001", // red
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginRight: "12px",
    fontSize: "16px",
    fontWeight: "500",
    transition: "background 0.3s",
  };

  const secondaryButtonStyle = { ...buttonStyle, background: "#718093" };

  const navButtonContainerStyle = {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    marginTop: "30px",
  };

  const messageContainerStyle = {
    padding: "12px 20px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "16px",
    fontWeight: "500",
    backgroundColor:
      messageType === "success"
        ? "#d4edda"
        : messageType === "error"
        ? "#f8d7da"
        : messageType === "info"
        ? "#cce5ff"
        : "transparent",
    color:
      messageType === "success"
        ? "#155724"
        : messageType === "error"
        ? "#721c24"
        : messageType === "info"
        ? "#004085"
        : "#333",
    border: messageType ? "1px solid" : "none",
    borderColor:
      messageType === "success"
        ? "#c3e6cb"
        : messageType === "error"
        ? "#f5c6cb"
        : messageType === "info"
        ? "#b8daff"
        : "transparent",
    display: message ? "block" : "none",
  };

  const accountInfoStyle = {
    background: "#e2e8f0",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "25px",
    fontSize: "14px",
  };

  const tabsContainerStyle = {
    display: "flex",
    marginBottom: "25px",
    borderBottom: "1px solid #ddd",
    overflowX: "auto",
  };

  const tabStyle = (isActive) => ({
    padding: "12px 24px",
    cursor: "pointer",
    borderBottom: isActive ? "3px solid #cc0001" : "none",
    color: isActive ? "#cc0001" : "#718093",
    fontWeight: isActive ? "600" : "400",
    transition: "all 0.3s",
  });

  const loadingOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    display: isLoading ? "flex" : "none",
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

  const tabTitles = {
    landRegistration: "Land Registration",
    loanApplication: "Land Loan Application",
    landPurchase: "Unit Purchase",
    loanRepayment: "Loan Repayment",
    defaultCheck: "Default Verification"
  };

  function renderTabs() {
    return (
      <div style={tabsContainerStyle}>
        {Object.entries(tabTitles).map(([page, title]) => (
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

  function renderPageContent() {
    switch (currentPage) {
      case "landRegistration":
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
                  <strong>Access Restricted:</strong> Only authorized URA Officers can register units.
                </p>
                <p style={{ marginTop: "10px" }}>
                  Please login with the appropriate credentials to access this function.
                </p>
              </div>
            )}
          </div>
        );
      case "loanApplication":
        return (
          <div style={sectionStyle}>
            <h2>Land Loan Application</h2>
            <p style={{ color: "#666", marginBottom: "20px" }}>
              Apply for Land loans with competitive interest rates and flexible terms.
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
                    <option value="DBS">Land Loan</option>
                    <option value="POSB">Bank Loan</option>
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
                  URA concessionary loan rate is currently 2.6% p.a.
                </small>
              </div>
              <button type="submit" style={buttonStyle}>
                Submit Loan Application
              </button>
            </form>
          </div>
        );
      case "landPurchase":
        return (
          <div style={sectionStyle}>
            <h2>Land Unit Purchase</h2>
            <p style={{ color: "#666", marginBottom: "20px" }}>
              Purchase Lands with secure blockchain verification of ownership transfer.
            </p>
            <form onSubmit={handlePurchaseLand}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Land Unit Number / Plot ID</label>
                <input
                  type="number"
                  value={purchasePlotId}
                  onChange={(e) => setPurchasePlotId(e.target.value)}
                  placeholder="Enter the Land unit number to purchase"
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
                  <strong>Note:</strong> Purchasing this Land unit will transfer the NFT ownership to your wallet.
                  Make sure you have sufficient funds and approvals in place.
                </p>
              </div>
              <button type="submit" style={buttonStyle}>
                Complete Purchase Transaction
              </button>
            </form>
          </div>
        );
      case "loanRepayment":
        return (
          <div style={sectionStyle}>
            <h2>Land Loan Repayment</h2>
            <p style={{ color: "#666", marginBottom: "20px" }}>
              Make secure loan repayments towards your land loan.
            </p>
            <form onSubmit={handleRepayLoan}>
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
      case "defaultCheck":
        return (
          <div style={sectionStyle}>
            <h2>Loan Default Verification (Bank Use)</h2>
            <p style={{ color: "#666", marginBottom: "20px" }}>
              Bank officers can verify loan status and check for defaults. Notifications will be sent to relevant parties.
            </p>
            <div style={{ background: "#f9f2ec", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
              <p style={{ margin: 0, color: "#8b572a" }}>
                <strong>Important:</strong> This function should only be used by authorized bank personnel.
                Default notifications will be sent to both Land authority and the borrower.
              </p>
            </div>
            <button onClick={handleCheckDefault} style={buttonStyle}>
              Verify Loan Status
            </button>
          </div>
        );
      default:
        return <div>Page not found</div>;
    }
  }

  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100vh", background: "#fff" }}>
      {/* Full Website Background */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, zIndex: 0 }}>
        <SingaporeHDBBackground />
      </div>

      {/* Main Application Container */}
      <div style={containerStyle}>
        <div style={loadingOverlayStyle}>
          <div style={spinnerStyle}></div>
        </div>
  
        {/* New Brand-Style Header */}
        <div style={headerStyle}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            {/* Approximate HDB Logo: red box + house shape */}
            <svg width="60" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              {/* Red rounded rectangle outline */}
              <rect x="10" y="10" width="80" height="80" rx="10" ry="10" stroke="red" stroke-width="5" fill="white"/>
              {/* White house shape inside */}
              <polygon points="50,20 20,50 35,50 35,75 65,75 65,50 80,50" fill="red" />
              <rect x="45" y="50" width="10" height="25" fill="white" />
            </svg>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#000" }}>
              URBAN &amp; REDEVELOPMENT AUTHORITY
            </h1>
          </div>
        </div>
  
        <div style={accountInfoStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>Connected Account:</strong> {account ? 
                `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : 
                "Not connected"
              }
              {govOfficer && account && govOfficer.toLowerCase() === account.toLowerCase() && 
                <span style={{ marginLeft: "10px", background: "#cc0001", color: "white", padding: "3px 8px", borderRadius: "4px", fontSize: "12px" }}>
                  URA Officer
                </span>
              }
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
          {currentPage !== "landRegistration" && (
            <button onClick={goToPreviousPage} style={secondaryButtonStyle}>
              Previous
            </button>
          )}
          {currentPage !== "defaultCheck" && (
            <button onClick={goToNextPage} style={buttonStyle}>
              Next
            </button>
          )}
        </div>
  
        <div style={{ marginTop: "40px", textAlign: "center", color: "#718093", fontSize: "14px" }}>
          <p>Singapore Urban Redevelopment Authority System © {new Date().getFullYear()}</p>
          <p>Secured by Blockchain Technology</p>
        </div>
      </div>
    </div>
  );
}

export default App;
