import React, { useState } from 'react';
import { applyLoan } from '../services/loanBankService';

function LoanApplication() {
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [message, setMessage] = useState('');

  const handleApply = async () => {
    try {
      const result = await applyLoan(principal, interestRate);
      // Inform the developer about the loan details including ETH top-up.
      setMessage(`Loan applied. Details: ${JSON.stringify(result)}`);
    } catch (error) {
      setMessage(`Loan application error: ${error.message}`);
    }
  };

  return (
    <div>
      <input 
        type="text"
        placeholder="Principal"
        value={principal}
        onChange={(e) => setPrincipal(e.target.value)}
      />
      <input 
        type="text"
        placeholder="Interest Rate"
        value={interestRate}
        onChange={(e) => setInterestRate(e.target.value)}
      />
      <button onClick={handleApply}>Apply for Loan</button>
      <p>{message}</p>
    </div>
  );
}

export default LoanApplication;
