import React, { useState } from 'react';
import { requestBankApproval, applyLoan } from '../services/loanBankService';

function LoanApplication() {
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [message, setMessage] = useState('');

  const handleApply = async () => {
    try {
      // Step 1: Submit the loan application to the Public Bank for approval.
      setMessage("Submitting loan application for Public Bank approval...");
      const approvalResult = await requestBankApproval(principal, interestRate);
      
      if (!approvalResult.approved) {
        setMessage("Loan application was not approved by the Public Bank.");
        return;
      }
      
      // Step 2: After approval, create the loan on the LoanBank contract.
      const result = await applyLoan(principal, interestRate);
      setMessage(`Loan applied successfully. Details: ${JSON.stringify(result)}`);
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
