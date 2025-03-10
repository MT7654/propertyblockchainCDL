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
  const [regType, setRegType] = useState("HDB"); // New: HDB flat type
  const [regTown, setRegTown] = useState("Ang Mo Kio"); // New: HDB town

  // Form state for Loan Application (FR2)
  const [loanPrincipal, setLoanPrincipal] = useState("");
  const [loanInterest, setLoanInterest] = useState("");
  const [loanTerm, setLoanTerm] = useState("25"); // New: Loan term in years
  const [loanType, setLoanType] = useState("HDB"); // New: Loan type

  // Form state for Land Purchase (FR3)
  const [purchasePlotId, setPurchasePlotId] = useState("");
  const [purchasePrice, setPurchasePrice] = useState(""); // New: Purchase price

  // Form state for Loan Repayment (FR4)
  const [repayAmount, setRepayAmount] = useState("");
  const [repaymentMethod, setRepaymentMethod] = useState("CPF"); // New: Repayment method

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

          // Attempt to retrieve contract owner (HDB Officer)
          try {
            const ownerAddress = await landRegistryContract.owner();
            setGovOfficer(ownerAddress);
            showMessage("Connected to HDB blockchain system successfully", "success");
          } catch (error) {
            console.error("Owner() call failed:", error);
            setGovOfficer(null);
            showMessage("Connected, but couldn't verify HDB Officer role", "info");
          }
        } catch (error) {
          console.error("Error loading blockchain data:", error);
          showMessage("Error connecting to HDB blockchain. Please check your MetaMask connection.", "error");
        } finally {
          setIsLoading(false);
        }
      } else {
        showMessage("Please install MetaMask to access HDB services", "error");
      }
    }
    loadBlockchainData();
  }, []);

  // Helper: Show message with type (success, error, info)
  function showMessage(msg, type = "info") {
    setMessage(msg);
    setMessageType(type);
    // Auto clear success and info messages after 5 seconds
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
      // Include town and flat type in metadata
      const enhancedMetadata = JSON.stringify({
        description: regMetadata,
        town: regTown,
        flatType: regType,
        registrationDate: new Date().toISOString()
      });
      
      const tx = await landRegistry.registerLand(plotId, enhancedMetadata, regOwner);
      await tx.wait();
      showMessage(`Unit ${regType} in ${regTown} registered successfully with NFT issuance`, "success");
      
      // Clear form
      setRegPlotId("");
      setRegMetadata("");
      // Keep the town and type for convenience
    } catch (error) {
      console.error(error);
      showMessage("Land registration failed. Only authorized HDB Officers can register property.", "error");
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
      
      // Additional metadata to be stored off-chain in a real implementation
      // For now, we'll just log it
      console.log({
        loanType,
        loanTerm,
        applicant: account,
        applicationDate: new Date().toISOString()
      });
      
      const tx = await loanBank.createLoan(principal, interestRate);
      await tx.wait();
      showMessage(`${loanType} loan application for $${principal} submitted successfully. Awaiting bank approval.`, "success");
      
      // Clear form
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
      // In a real implementation, price would be part of the transaction
      // Here we're just logging it
      console.log({
        plotId,
        purchasePrice,
        purchaseDate: new Date().toISOString(),
        buyer: account
      });
      
      const tx = await landRegistry.purchaseLand(plotId);
      await tx.wait();
      showMessage(`HDB unit #${plotId} purchased successfully! Ownership transferred to your account.`, "success");
      
      // Clear form
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
      // Log repayment method (would be stored in a real implementation)
      console.log({
        repaymentMethod,
        amount,
        repaymentDate: new Date().toISOString(),
        payer: account
      });
      
      const tx = await loanBank.repayLoan(amount);
      await tx.wait();
      showMessage(`Loan repayment of $${amount} via ${repaymentMethod} processed successfully!`, "success");
      
      // Clear form
      setRepayAmount("");
    } catch (error) {
      console.error(error);
      if (
        error.data &&
        error.data.message &&
        error.data.message.includes("No active loan")
      ) {
        showMessage("No active HDB loan found. Please ensure you have an active loan before repaying.", "error");
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
      showMessage("Default check completed! Notifications sent to Public Bank & HDB Officer.", "success");
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

  // Styling
  const containerStyle = {
    fontFamily: "'Inter', 'Roboto', sans-serif",
    maxWidth: "1200px",
    margin: "20px auto",
    padding: "30px",
    background: "#f8f9fa",
    borderRadius: "12px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
  };

  const headerStyle = {
    textAlign: "center",
    marginBottom: "30px",
    color: "#273c75", // Singapore blue
  };

  const sectionStyle = {
    background: "#ffffff",
    padding: "25px",
    marginBottom: "25px",
    borderRadius: "10px",
    boxShadow: "0 3px 8px rgba(0,0,0,0.08)",
    borderLeft: "5px solid #273c75", // Singapore blue accent
  };

  const formGroupStyle = {
    marginBottom: "18px",
  };

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
    background: "#273c75", // Singapore blue
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginRight: "12px",
    fontSize: "16px",
    fontWeight: "500",
    transition: "background 0.3s",
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: "#718093", // Gray
  };

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
    backgroundColor: messageType === "success" ? "#d4edda" : 
                     messageType === "error" ? "#f8d7da" : 
                     messageType === "info" ? "#cce5ff" : "transparent",
    color: messageType === "success" ? "#155724" : 
           messageType === "error" ? "#721c24" : 
           messageType === "info" ? "#004085" : "#333",
    border: messageType ? "1px solid" : "none",
    borderColor: messageType === "success" ? "#c3e6cb" : 
                 messageType === "error" ? "#f5c6cb" : 
                 messageType === "info" ? "#b8daff" : "transparent",
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
    borderBottom: isActive ? "3px solid #273c75" : "none",
    color: isActive ? "#273c75" : "#718093",
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
    borderTop: "5px solid #273c75",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    animation: "spin 1s linear infinite",
  };

  // Tab titles
  const tabTitles = {
    landRegistration: "HDB Unit Registration",
    loanApplication: "HDB Loan Application",
    landPurchase: "Unit Purchase",
    loanRepayment: "Loan Repayment",
    defaultCheck: "Default Verification"
  };

  // Render tabs navigation
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

  // Render page content based on the current page
  function renderPageContent() {
    switch (currentPage) {
      case "landRegistration":
        return (
          <div style={sectionStyle}>
            <h2>HDB Unit Registration (Officer Only)</h2>
            <p style={{color: "#666", marginBottom: "20px"}}>
              Register new HDB units and assign ownership through secure blockchain NFTs.
            </p>
            {account &&
            govOfficer &&
            account.toLowerCase() === govOfficer.toLowerCase() ? (
              <form onSubmit={handleRegisterLand}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Unit Number / Plot ID</label>
                  <input
                    type="number"
                    value={regPlotId}
                    onChange={(e) => setRegPlotId(e.target.value)}
                    placeholder="Enter HDB Unit Number"
                    style={inputStyle}
                    required
                  />
                </div>
                <div style={{display: "flex", gap: "20px"}}>
                  <div style={{...formGroupStyle, flex: 1}}>
                    <label style={labelStyle}>HDB Town</label>
                    <select
                      value={regTown}
                      onChange={(e) => setRegTown(e.target.value)}
                      style={selectStyle}
                      required
                    >
                      {hdbTowns.map(town => (
                        <option key={town} value={town}>{town}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{...formGroupStyle, flex: 1}}>
                    <label style={labelStyle}>Flat Type</label>
                    <select
                      value={regType}
                      onChange={(e) => setRegType(e.target.value)}
                      style={selectStyle}
                      required
                    >
                      {hdbTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
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
                  Register HDB Unit & Issue NFT
                </button>
              </form>
            ) : (
              <div style={{ color: "#721c24", background: "#f8d7da", padding: "15px", borderRadius: "5px" }}>
                <p>
                  <strong>Access Restricted:</strong> Only authorized HDB Officers can register units.
                </p>
                <p style={{marginTop: "10px"}}>
                  Please login with the appropriate credentials to access this function.
                </p>
              </div>
            )}
          </div>
        );
      case "loanApplication":
        return (
          <div style={sectionStyle}>
            <h2>HDB Loan Application</h2>
            <p style={{color: "#666", marginBottom: "20px"}}>
              Apply for HDB housing loans with competitive interest rates and flexible terms.
            </p>
            <form onSubmit={handleApplyForLoan}>
              <div style={{display: "flex", gap: "20px"}}>
                <div style={{...formGroupStyle, flex: 1}}>
                  <label style={labelStyle}>Loan Type</label>
                  <select
                    value={loanType}
                    onChange={(e) => setLoanType(e.target.value)}
                    style={selectStyle}
                    required
                  >
                    <option value="HDB">HDB Loan</option>
                    <option value="Bank">Bank Loan</option>
                    <option value="BTO">BTO Financing</option>
                    <option value="Resale">Resale Flat Loan</option>
                  </select>
                </div>
                <div style={{...formGroupStyle, flex: 1}}>
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
                <small style={{color: "#666", marginTop: "5px", display: "block"}}>
                  HDB concessionary loan rate is currently 2.6% p.a.
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
            <h2>HDB Unit Purchase</h2>
            <p style={{color: "#666", marginBottom: "20px"}}>
              Purchase HDB flats with secure blockchain verification of ownership transfer.
            </p>
            <form onSubmit={handlePurchaseLand}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>HDB Unit Number / Plot ID</label>
                <input
                  type="number"
                  value={purchasePlotId}
                  onChange={(e) => setPurchasePlotId(e.target.value)}
                  placeholder="Enter the HDB unit number to purchase"
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
              <div style={{background: "#e2f7e2", padding: "15px", borderRadius: "8px", marginBottom: "20px"}}>
                <p style={{margin: 0, color: "#2d632d"}}>
                  <strong>Note:</strong> Purchasing this HDB unit will transfer the NFT ownership to your wallet.
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
            <h2>HDB Loan Repayment</h2>
            <p style={{color: "#666", marginBottom: "20px"}}>
              Make secure loan repayments towards your HDB housing loan.
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
            <p style={{color: "#666", marginBottom: "20px"}}>
              Bank officers can verify loan status and check for defaults. Notifications will be sent to relevant parties.
            </p>
            <div style={{background: "#f9f2ec", padding: "15px", borderRadius: "8px", marginBottom: "20px"}}>
              <p style={{margin: 0, color: "#8b572a"}}>
                <strong>Important:</strong> This function should only be used by authorized bank personnel.
                Default notifications will be sent to both HDB and the borrower.
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
    <div style={containerStyle}>
      <div style={loadingOverlayStyle}>
        <div style={spinnerStyle}></div>
      </div>

      <h1 style={headerStyle}>Singapore HDB Digital Housing System</h1>
      
      <div style={accountInfoStyle}>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
          <div>
            <strong>Connected Account:</strong> {account ? 
              `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : 
              "Not connected"
            }
            {govOfficer && account && govOfficer.toLowerCase() === account.toLowerCase() && 
              <span style={{marginLeft: "10px", background: "#273c75", color: "white", padding: "3px 8px", borderRadius: "4px", fontSize: "12px"}}>
                HDB Officer
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
      
      <div style={{marginTop: "40px", textAlign: "center", color: "#718093", fontSize: "14px"}}>
        <p>Singapore HDB Digital Housing System © {new Date().getFullYear()}</p>
        <p>Secured by Blockchain Technology</p>
      </div>
    </div>
  );
}

export default App;