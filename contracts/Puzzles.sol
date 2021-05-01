pragma solidity ^0.7.0;

// SPDX-License-Identifier: UNLICENSED
import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "./Groups.sol";
import "./Strings.sol";

contract Puzzles is Ownable, Groups{
  using Strings for string;
  
  constructor() {}

  enum Class {
    Common,
    Uncommon,
    Rare,
    Epic,
    Legendary
  }

  struct Puzzle {
    string title;
    uint256 width;
    uint256 height;
    bool isActive;
    uint256 balance;
    uint256 group;
    uint256 minTokenId;//token ids for a puzzle must be sequential from minTokenId to maxTokenId
    uint256 maxTokenId;//token ids for a puzzle must be sequential from minTokenId to maxTokenId
    uint256 weight;
  }

  mapping (uint256 => Puzzle) public PuzzleStructs;
  uint256 public puzzleCount = 0;
  mapping (uint256 => mapping (uint256 => uint256[])) public PuzzlesToClassToTokens;

  modifier idExists(uint256 _puzzleId) {
    require(puzzleCount >= _puzzleId, "_puzzleId must be lower than number of puzzles");
    _;
  }

  function _addPuzzle(string memory _title, uint256 _width, uint256 _height, bool _isActive, uint256 _group, uint256 _weight) internal onlyOwner {
    require(Groups.groupCount >= _group, "Invalid group");
    require(bytes(_title).length > 0, "_title cannot be blank");
    require(_width > 0 && _height > 0, "_width and _height must be greater than 0");
    require(_weight > 0, "_weight must be greater than 0");
    uint256 _id = _incrementPuzzleCount(); 
    PuzzleStructs[_id].title = _title;
    PuzzleStructs[_id].width = _width;
    PuzzleStructs[_id].height = _height;
    PuzzleStructs[_id].isActive = _isActive;
    PuzzleStructs[_id].group = _group;
    PuzzleStructs[_id].weight = _weight;
  }

  function _assignTokenIdsForClass(uint256 _puzzleId, Class _class, uint256[] memory _tokenIds) internal onlyOwner idExists(_puzzleId) {
    PuzzlesToClassToTokens[_puzzleId][uint256(_class)] = _tokenIds;
  }

  function setPuzzleActive(uint256 _puzzleId, bool _isActive) public onlyOwner idExists(_puzzleId) {
    PuzzleStructs[_puzzleId].isActive = _isActive;
  }

  function setPuzzleGroup(uint256 _puzzleId, uint256 _group) public onlyOwner idExists(_puzzleId) {
    require(Groups.groupCount >= _group, "Invalid group");
    PuzzleStructs[_puzzleId].group = _group;
  }

  function _incrementPuzzleCount() private returns(uint) {
    puzzleCount++;
    return puzzleCount;
  }    

  /* Assigns token ids to each rarity class for a puzzle */
  function puzzleInit(uint256 _puzzleId, uint256[] memory _commonPieces, uint256[] memory _uncommonPieces, uint256[] memory _rarePieces, uint256[] memory _epicPieces, uint256[] memory _legendaryPieces) public onlyOwner idExists(_puzzleId) {
    require((Puzzles.PuzzleStructs[_puzzleId].width * Puzzles.PuzzleStructs[_puzzleId].height) == 
      (_commonPieces.length + _uncommonPieces.length + _rarePieces.length + _epicPieces.length + _legendaryPieces.length), "Incorrect number of pieces");
    _assignTokenIdsForClass(_puzzleId, Class.Common, _commonPieces);
    _assignTokenIdsForClass(_puzzleId, Class.Uncommon, _uncommonPieces);
    _assignTokenIdsForClass(_puzzleId, Class.Rare, _rarePieces);
    _assignTokenIdsForClass(_puzzleId, Class.Epic, _epicPieces);
    _assignTokenIdsForClass(_puzzleId, Class.Legendary, _legendaryPieces);
  }  

  function _setMinMaxTokenIds(uint256[2] memory _minMaxIds) internal onlyOwner {
    PuzzleStructs[puzzleCount].minTokenId = _minMaxIds[0];
    PuzzleStructs[puzzleCount].maxTokenId = _minMaxIds[1];    
  }

  function getTokenIdByClassForPuzzle(uint256 _puzzleId, Class _class) external view idExists(_puzzleId) returns (uint256[] memory) {
    return PuzzlesToClassToTokens[_puzzleId][uint256(_class)];
  }
}
