import React, { useState } from 'react';
import { purchaseLand } from '/Users/rashidrasool/Library/CloudStorage/OneDrive-NanyangTechnologicalUniversity/reactAPP/src/services/landRegistryServices.js';

function LandPurchase() {
  const [plotId, setPlotId] = useState('');
  const [message, setMessage] = useState('');

  const handlePurchase = async () => {
    try {
      const result = await purchaseLand(plotId);
      setMessage(`Land purchase successful. Details: ${JSON.stringify(result)}`);
    } catch (error) {
      setMessage(`Purchase error: ${error.message}`);
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
      <button onClick={handlePurchase}>Purchase Land</button>
      <p>{message}</p>
    </div>
  );
}

export default LandPurchase;
