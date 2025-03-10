const Web3 = require("web3").default; // Use the .default property for web3@4.16.0
const fs = require("fs");
const solc = require("solc");

(async () => {
  // Initialize Web3 with your provider (e.g., Ganache running on 7545)
  const web3 = new Web3("http://127.0.0.1:7545");

  // Read Solidity contract from file
  const contractPath = "contracts/Test.sol";
  const source = fs.readFileSync(contractPath, "utf8");

  // Prepare the Solidity compiler input in standard JSON format
  const input = {
    language: "Solidity",
    sources: {
      "Test.sol": {
        content: source,
      },
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"],
        },
      },
    },
  };

  // Compile the contract
  let compiled;
  try {
    compiled = JSON.parse(solc.compile(JSON.stringify(input)));
    if (compiled.errors) {
      // Filter out warnings and exit on errors
      const errors = compiled.errors.filter(err => err.severity === "error");
      if (errors.length > 0) {
        console.error("❌ Compilation errors:", errors);
        process.exit(1);
      } else {
        console.warn("⚠️ Compilation warnings:", compiled.errors);
      }
    }
  } catch (error) {
    console.error("❌ Compilation error:", error);
    process.exit(1);
  }

  // Extract ABI and Bytecode
  const contractName = Object.keys(compiled.contracts["Test.sol"])[0];
  const contractData = compiled.contracts["Test.sol"][contractName];
  const abi = contractData.abi;
  const bytecode = contractData.evm.bytecode.object;

  // Deploy the contract
  async function deployContract() {
    try {
      const accounts = await web3.eth.getAccounts();
      console.log("🚀 Deploying from account:", accounts[0]);

      const contract = new web3.eth.Contract(abi);
      const instance = await contract
        .deploy({ data: "0x" + bytecode })
        .send({ from: accounts[0], gas: 3000000 });

      console.log("✅ Contract deployed at address:", instance.options.address);
    } catch (error) {
      console.error("❌ Deployment error:", error);
    }
  }

  // Execute deployment
  await deployContract();
})();

