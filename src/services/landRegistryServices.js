import { ethers } from 'ethers';
import landRegistryArtifact from '../contracts/LandRegistry.json'; 

// Update with your deployed LandRegistry contract address.
const landRegistryAddress = "0x74aF28Bc42C3967b00d72c59053F144207503607";

// Explicitly set network details for Ganache (chainId may vary)
const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:7545", { chainId: 1337, name: 'ganache' });

// Override ENS resolution to pass through valid addresses
provider.resolveName = async (name) => {
  if (ethers.utils.isAddress(name)) {
    return name;
  }
  return null;
};

const signer = provider.getSigner();
const landRegistryContract = new ethers.Contract(
  landRegistryAddress,          // LandRegistry contract address
  landRegistryArtifact.abi,     // ABI from the LandRegistry artifact
  signer
);

export async function registerLand(plotId, metadata, ownerDetails) {
  console.log("Starting land registration for plotId:", plotId);
  
  // Call registerLand on the LandRegistry smart contract.
  const tx = await landRegistryContract.registerLand(plotId, metadata, ownerDetails);
  console.log("Transaction submitted with hash:", tx.hash);
  await tx.wait(); // FR1.3: Wait for the LandRegistered event.
  console.log("Transaction confirmed:", tx.hash);
  
  // For demonstration, assume the event returns an NFT token id.
  // In production, parse the event log from the transaction receipt.
  const nftToken = "NFT_TOKEN_ID";
  
  // Log the registration details to MongoDB via your backend API.
  try {
    console.log("Sending POST request to backend for land registration...");
    const response = await fetch('http://localhost:5001/api/land-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plotId,
        metadata,
        ownerDetails,
        nftToken,
        txHash: tx.hash,
      }),
    });

    if (!response.ok) {
      console.error('Failed to log land registration to MongoDB:', response.statusText);
    } else {
      console.log("Successfully logged land registration to MongoDB.");
    }
  } catch (error) {
    console.error('Error during logging to MongoDB:', error);
  }
  
  return { nftToken, txHash: tx.hash };
}

export async function approvePurchase(plotId) {
  console.log("Approving purchase for plotId:", plotId);
  // Example: call an approve function on the smart contract.
  const tx = await landRegistryContract.approvePurchase(plotId);
  console.log("Approve purchase transaction hash:", tx.hash);
  return tx;
}

export async function purchaseLand(plotId) {
  console.log("Starting land purchase for plotId:", plotId);
  // Call purchaseLand on the LandRegistry smart contract.
  const tx = await landRegistryContract.purchaseLand(plotId);
  console.log("Purchase transaction submitted:", tx.hash);
  await tx.wait(); // FR3.3: Wait for the LandTransferred event.
  console.log("Purchase transaction confirmed:", tx.hash);
  return { txHash: tx.hash };
}
