import { ethers } from 'ethers';
import landRegistryArtifact from '../contracts/LandRegistry.json'; 


// Explicitly set network details for Ganache (chainId may vary)
const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:7545", { chainId: 1337, name: 'ganache' });

// Override ENS resolution to pass through valid addresses
provider.resolveName = async (name) => {
  if (ethers.utils.isAddress(name)) {
    return name;
  }
  return null;
};

// Extract ABI and dynamic address based on network ID
const landRegistryABI = landRegistryArtifact.abi;
const networkId = "1337"; // Ganache's default chainId

// Get contract address from artifact networks
const landRegistryAddress = landRegistryArtifact.networks?.[networkId]?.address;

if (!landRegistryAddress) {
  throw new Error(`LandRegistry contract not deployed on network ${networkId}`);
}

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
  const receipt = await tx.wait(); // FR1.3: Wait for the LandRegistered event.
  console.log("Transaction confirmed:", tx.hash);
  
  // For demonstration, assume the event returns an NFT token id.
  // In production, parse the event log from the transaction receipt.
  // Extract tokenId from the LandRegistered event
  const landRegisteredEvent = receipt.events.find((e) => e.event === "LandRegistered");
  const nftToken = landRegisteredEvent?.args?.tokenId?.toString();
  let tokenURI;
  let metadataFromURI = null;

  try {
    tokenURI = await landRegistryContract.tokenURI(nftToken);
    console.log("Fetched tokenURI:", tokenURI);

    const metadataResponse = await fetch(tokenURI);
    metadataFromURI = await metadataResponse.json();
    console.log("Fetched NFT metadata:", metadataFromURI);
  } catch (err) {
    console.error("Failed to fetch token URI or metadata:", err);
  }

  
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
  
  return { nftToken, txHash: tx.hash, tokenURI, metadata:metadataFromURI };
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
