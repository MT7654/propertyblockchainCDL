import React, { useState } from 'react';
import { approvePurchase, purchaseLand } from '../services/landRegistryServices';

function LandPurchase() {
  const [plotId, setPlotId] = useState('');
  const [message, setMessage] = useState('');

  const handlePurchase = async () => {
    try {
      // First, send an approval transaction.
      const approvalTx = await approvePurchase(plotId);
      await approvalTx.wait(); // Wait for the approval to be confirmed.

      // Once approved, execute the purchase transaction.
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
