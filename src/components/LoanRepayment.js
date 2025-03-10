import React, { useState } from 'react';
import { repayLoan } from '../services/loanBankService';

function LoanRepayment() {
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [message, setMessage] = useState('');

  const handleRepayment = async () => {
    try {
      const result = await repayLoan(repaymentAmount);
      setMessage(`Loan repaid. Updated balance: ${result.newBalance}`);
    } catch (error) {
      setMessage(`Repayment error: ${error.message}`);
    }
  };

  return (
    <div>
      <input 
        type="text"
        placeholder="Repayment Amount"
        value={repaymentAmount}
        onChange={(e) => setRepaymentAmount(e.target.value)}
      />
      <button onClick={handleRepayment}>Repay Loan</button>
      <p>{message}</p>
    </div>
  );
}

export default LoanRepayment;
