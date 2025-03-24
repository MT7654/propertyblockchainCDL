// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

// Import models
const LandRegistration = require('./models/LandRegistration');
const LoanApplication = require('./models/LoanApplication');
// (Add additional models for purchase, repayment, etc. if needed)

const app = express();
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// Connect to MongoDB (adjust connection string as needed)
mongoose.connect('mongodb://localhost:27017/landsystem', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Endpoint to update Loan Application data after repayment
app.put('/api/loan-application/update', async (req, res) => {
  console.log("PUT /api/loan-application/update called with:", req.body);
  try {
    let { loanDeveloperAddress, newBalance, isActive } = req.body;

    // Validate input
    if (!loanDeveloperAddress) {
      console.error("Error: Missing loanDeveloperAddress in request.");
      return res.status(400).json({ error: "loanDeveloperAddress is required" });
    }

    // Log existing records before updating
    const existingRecord = await LoanApplication.findOne({ loanDeveloperAddress: loanDeveloperAddress, isActive: true });

    if (!existingRecord) {
      console.error("Error: No loan record found for", loanDeveloperAddress);
      return res.status(404).json({ error: "Loan record not found for the given developer address." });
    }

    console.log("Existing loan record found:", existingRecord);

    // Find the active loan record for the given developer address
    const updatedRecord = await LoanApplication.findOneAndUpdate(
      { loanDeveloperAddress: loanDeveloperAddress, isActive: true },
      { balance: newBalance, isActive: isActive },
      { new: true }
    );
    
    if (!updatedRecord) {
      return res.status(404).json({ error: "Loan record not found for the given developer address." });
    }
    
    res.status(200).json({ message: 'Loan application record updated.', updatedRecord });
  } catch (error) {
    console.error("Error updating loan application:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to log Land Registration data
app.post('/api/land-registration', async (req, res) => {
  try {
    const newRecord = new LandRegistration(req.body);
    await newRecord.save();
    console.log("Success inserting Land registration:", newRecord);
    res.status(200).json({ message: 'Land registration record saved.' });
  } catch (error) {
    console.error("Error inserting land registration:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to log Loan Application data
app.post('/api/loan-application', async (req, res) => {
  try {
    const newRecord = new LoanApplication(req.body);
    await newRecord.save();
    res.status(200).json({ message: 'Loan application record saved.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// add more endpoints for land purchase, loan repayment, etc.
// Express example
app.get('/api/bloans', async (req, res) => {
  try {
    const { account } = req.query;
    // Query your database for loans matching this account.
    // Assume LoanApplication is your Mongoose model.
    const loans = await LoanApplication.find({ borrowerAddress: account });
    res.status(200).json(loans);
  } catch (error) {
    console.error("Error fetching loans:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/loans', async (req, res) => {
  try {
    const { account } = req.query;
    // Query your database for loans matching this account.
    // Assume LoanApplication is your Mongoose model.
    const loans = await LoanApplication.find({ loanDeveloperAddress: account });
    res.status(200).json(loans);
  } catch (error) {
    console.error("Error fetching loans:", error);
    res.status(500).json({ error: error.message });
  }
});

// Updated route to fetch all loans with corresponding land metadata
app.get('/api/all-loans', async (req, res) => {
  try {
    const loans = await LoanApplication.find();

    const enrichedLoans = await Promise.all(
      loans.map(async (loan) => {
        const land = await LandRegistration.findOne({ ownerDetails: loan.borrowerAddress });
        return {
          ...loan.toObject(),
          plotId: land?.plotId || null,
          landMetadata: land?.metadata || null
        };
      })
    );

    res.status(200).json(enrichedLoans);
  } catch (error) {
    console.error("Error fetching all loans with land data:", error);
    res.status(500).json({ error: error.message });
  }
});


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
