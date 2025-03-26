// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LandRegistry is ERC721, Ownable {
    struct Land {
        uint256 plotId;
        string metadata;
        address currentOwner;
    }
    
    uint256 public nextTokenId;
    mapping(uint256 => Land) public lands;
    mapping(uint256 => bool) public isRegistered;
    mapping(uint256 => uint256) public plotToToken;

    event LandRegistered(uint256 indexed tokenId, uint256 plotId, string metadata, address owner);
    event LandTransferred(uint256 indexed tokenId, uint256 plotId, address from, address to);

    constructor() ERC721("LandRegistryToken", "LAND") {}

    // Only the Government Officer (contract owner) can register land.
    // FR1.1 & FR1.2: Provide plotId, metadata, and ownership details.
    function registerLand(uint256 _plotId, string memory _metadata, address _owner) public onlyOwner {
        require(!isRegistered[_plotId], "Land already registered");
        uint256 tokenId = nextTokenId;
        nextTokenId++;
        lands[tokenId] = Land(_plotId, _metadata, _owner);
        isRegistered[_plotId] = true;
        plotToToken[_plotId] = tokenId;
        _mint(_owner, tokenId);
        emit LandRegistered(tokenId, _plotId, _metadata, _owner);
    }

    // FR3: Land Purchase – Developer initiates purchase by providing plotId.
    // This function transfers the NFT from the current owner (Government) to the Developer.
    function purchaseLand(uint256 _plotId) public payable {
        uint256 tokenId = plotToToken[_plotId];
        require(_exists(tokenId), "Land not registered");
        address currentOwner = ownerOf(tokenId);
        require(currentOwner != msg.sender, "Cannot purchase your own land");
        // Optionally add price and approval logic here.
        _transfer(currentOwner, msg.sender, tokenId);
        lands[tokenId].currentOwner = msg.sender;
        emit LandTransferred(tokenId, _plotId, currentOwner, msg.sender);
    }

    // Optional: Override tokenURI to serve metadata for each token
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
    
        // For local development (Ganache), you can return a static localhost URL
        return string(
        abi.encodePacked(
            "http://localhost:5001/metadata/",
            Strings.toString(tokenId),
            ".json"
        )
    );
}

}
