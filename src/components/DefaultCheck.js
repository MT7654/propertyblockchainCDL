import React, { useState } from 'react';
import { checkDefault } from '../services/loanBankService';

function DefaultCheck() {
  const [loanId, setLoanId] = useState('');
  const [message, setMessage] = useState('');

  const handleDefaultCheck = async () => {
    try {
      const result = await checkDefault(loanId);
      if(result.defaulted) {
        setMessage(`Developer default detected. Notifications sent to Public Bank and Government Officer.`);
      } else {
        setMessage(`No default detected for loan ${loanId}.`);
      }
    } catch (error) {
      setMessage(`Default check error: ${error.message}`);
    }
  };

  return (
    <div>
      <input 
        type="text"
        placeholder="Loan ID"
        value={loanId}
        onChange={(e) => setLoanId(e.target.value)}
      />
      <button onClick={handleDefaultCheck}>Check Default</button>
      <p>{message}</p>
    </div>
  );
}

export default DefaultCheck;
