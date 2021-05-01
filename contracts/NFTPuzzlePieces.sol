pragma solidity ^0.7.0;

// SPDX-License-Identifier: UNLICENSED

import "./ERC1155Tradable.sol";
import "./Puzzles.sol";

contract NFTPuzzlePieces is ERC1155Tradable, Puzzles {
  constructor(address _proxyRegistryAddress)
  ERC1155Tradable("NFT Puzzle Pieces", "NPP", _proxyRegistryAddress) {
    _setBaseMetadataURI("https://nftpuzzle.cat/nft/");
  }

  function contractURI() public pure returns (string memory) {
    return "http://nftpuzzle.cat/contract/nftpuzzle";
  }

  /* Adding a puzzle does not mint the pieces. The min/max ids are reserved and set in the puzzle struct. */
  /* puzzleInit MUST be called with the id range for each rarity. */
  /* This is handled outside the contract because it could be very costly to generate in the contract */
  function addPuzzle(string memory _title, uint256 _width, uint256 _height, bool _isActive, uint256 _group, uint256 _weight) public onlyOwner {
    _addPuzzle(_title, _width, _height, _isActive, _group, _weight);
    _setMinMaxTokenIds(_getTokenIds(_width * _height));
  }

  /* returns array of token count suquentially from min to max */
  function getPuzzlePiecesForAddress(address _address, uint256 _puzzleId) external view idExists(_puzzleId) returns (uint256[] memory) {
    uint[] memory result;
    for (uint256 i = PuzzleStructs[_puzzleId].minTokenId; i <= PuzzleStructs[_puzzleId].maxTokenId; i++) {
      result[i] = balanceOf(_address, i);
    }
    return result;
  }
}
