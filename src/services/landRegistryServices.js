import { ethers } from 'ethers';
import landRegistryArtifact from '../contracts/LandRegistry.json'; 

// Update with your deployed LandRegistry contract address.
const landRegistryAddress = "0xc863c281de5a933006D0E60BdC0305E5B3b2d748";

// Explicitly set network details for Ganache (chainId may vary)
const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:7545", { chainId: 1337, name: 'ganache' });

// Optionally, override ENS resolution if needed:
provider.resolveName = async (name) => null;

const signer = provider.getSigner();
const landRegistryContract = new ethers.Contract(
  landRegistryAddress,  // LandRegistry contract address
  landRegistryArtifact.abi, // ABI from the LandRegistry artifact
  signer
);

export async function registerLand(plotId, metadata, ownerDetails) {
  // Call registerLand on the LandRegistry smart contract.
  const tx = await landRegistryContract.registerLand(plotId, metadata, ownerDetails);
  await tx.wait(); // FR1.3: Wait for the LandRegistered event.
  
  // For demonstration, assume the event returns an NFT token id.
  // In production, parse the event log from the transaction receipt.
  return { nftToken: "NFT_TOKEN_ID", txHash: tx.hash };
}

export async function purchaseLand(plotId) {
  // Call purchaseLand on the LandRegistry smart contract.
  const tx = await landRegistryContract.purchaseLand(plotId);
  await tx.wait(); // FR3.3: Wait for the LandTransferred event.
  return { txHash: tx.hash };
}
