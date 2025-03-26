import React, { useState } from 'react';
import { registerLand } from '/Users/rashidrasool/Library/CloudStorage/OneDrive-NanyangTechnologicalUniversity/reactAPP/src/services/landRegistryServices.js';

function LandRegistration() {
  const [plotId, setPlotId] = useState('');
  const [metadata, setMetadata] = useState('');
  const [ownerDetails, setOwnerDetails] = useState('');
  const [message, setMessage] = useState('');
  const [tokenId, setTokenId] = useState(null);

  const handleRegister = async () => {
    try {
      const result = await registerLand(plotId, metadata, ownerDetails);
      console.log("Transaction submitted with hash:", tx.hash);
      const receipt = await tx.wait();
      console.log("🔍 Events in receipt:", receipt.events);
      console.log("Transaction confirmed:", tx.hash);

     // Extract tokenId from the LandRegistered event
      const landRegisteredEvent = receipt.events.find((e) => e.event === "LandRegistered");
      const tokenId = landRegisteredEvent?.args?.tokenId?.toString();
      // On success, notify the government officer and provide the NFT token.
      setMessage(`Land registered successfully. NFT Token: ${result.nftToken}`);
    } catch (error) {
      setMessage(`Registration error: ${error.message}`);
    }
  };

  return (
    <div>
      <input 
        type="text"
        placeholder="Plot ID"
        value={plotId}
        onChange={(e) => setPlotId(e.target.value)}
      />
      <input 
        type="text"
        placeholder="Metadata"
        value={metadata}
        onChange={(e) => setMetadata(e.target.value)}
      />
      <input 
        type="text"
        placeholder="Owner Details"
        value={ownerDetails}
        onChange={(e) => setOwnerDetails(e.target.value)}
      />
      <button onClick={handleRegister}>Register Land</button>
      <p>{message}</p>
    </div>
  );
}

export default LandRegistration;
