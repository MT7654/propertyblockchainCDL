// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract LandRegistry is ERC721, Ownable, ReentrancyGuard {
    struct Land {
        uint256 plotId;
        string metadata;
        address currentOwner;
    }

    uint256 public nextTokenId;

    mapping(uint256 => Land) private lands;
    mapping(uint256 => bool) private isRegistered;
    mapping(uint256 => uint256) private plotToToken;

    event LandRegistered(uint256 indexed tokenId, uint256 plotId, string metadata, address indexed owner);
    event LandTransferred(uint256 indexed tokenId, uint256 plotId, address indexed from, address indexed to);

    constructor() ERC721("LandRegistryToken", "LAND") {}

    // Register a new plot
    // Only the Government Officer (contract owner) can register land.
    // FR1.1 & FR1.2: Provide plotId, metadata, and ownership details.
    function registerLand(uint256 _plotId, string memory _metadata, address _owner) public onlyOwner {
        require(!isRegistered[_plotId], "Land already registered");
        require(_owner != address(0), "Invalid owner address");
        require(bytes(_metadata).length > 0, "Metadata cannot be empty");

        uint256 tokenId = nextTokenId;
        nextTokenId++;

        lands[tokenId] = Land(_plotId, _metadata, _owner);
        isRegistered[_plotId] = true;
        plotToToken[_plotId] = tokenId;

        _safeMint(_owner, tokenId);

        emit LandRegistered(tokenId, _plotId, _metadata, _owner);
    }

    // FR3: Land Purchase – Developer initiates purchase by providing plotId.
    // This function transfers the NFT from the current owner (Government) to the Developer.
    function purchaseLand(uint256 _plotId) public payable nonReentrant {
        require(isRegistered[_plotId], "Land not registered");

        uint256 tokenId = plotToToken[_plotId];
        address currentOwner = ownerOf(tokenId);

        require(currentOwner != msg.sender, "Cannot purchase your own land");

        // State update before external call
        lands[tokenId].currentOwner = msg.sender;

        _transfer(currentOwner, msg.sender, tokenId);

        emit LandTransferred(tokenId, _plotId, currentOwner, msg.sender);
    }

    // Override tokenURI to support NFT metadata
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");
        return string(
            abi.encodePacked(
                "http://localhost:5001/metadata/",
                Strings.toString(tokenId),
                ".json"
            )
        );
    }

    // Safe read access to land data
    function getLand(uint256 tokenId) public view returns (Land memory) {
        require(_exists(tokenId), "Land not found");
        return lands[tokenId];
    }

    function getTokenIdByPlotId(uint256 plotId) public view returns (uint256) {
        require(isRegistered[plotId], "Plot not registered");
        return plotToToken[plotId];
    }

    function isPlotRegistered(uint256 plotId) public view returns (bool) {
        return isRegistered[plotId];
    }
}
