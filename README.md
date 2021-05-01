# NFTPuzzle
NFT Puzzle is a representation of puzzles using ERC1155 NFTs to represent the puzzle pieces. The contracts support adding new puzzles, creating groups for puzzles, and assigning rarity to pieces of each puzzle. The project does not have a front end yet.

## Groups
Groups can be added by the contract owner. Groups allow puzzle organization. Groups have a title, weight, and active flag. Weight is used as an organizational indicator. It's up to the front end implementation on how weight is used, but it could be used to sort puzzle groups or provide some kind of presentation variation. Groups can have their title, weight, and active flag modified.

## Puzzles
Puzzles can be added by the contract owner.

function addPuzzle(string memory _title, uint256 _width, uint256 _height, bool _isActive, uint256 _group, uint256 _weight) public onlyOwner
  * title (string): the puzzle name
  * width (int): the number of pieces along the X axis
  * height (int): the number of pieces along the Y axis
  * isActive (bool): indicates whether or not the puzzle is active
  * group (int): the ID of the group. The group must exist.
  * weight (int): organizational indicator used by the front end

When a puzzle is added using the "addPuzzle" function, the structure for the puzzle is saved and the NFT IDs are reserved. The NFTs are not minted. The function "puzzleInit" must be called immediately thereafter to assign the rarity for the pieces (NFts).

function puzzleInit(uint256 _puzzleId, uint256[] memory _commonPieces, uint256[] memory _uncommonPieces, uint256[] memory _rarePieces, uint256[] memory _epicPieces, uint256[] memory _legendaryPieces) public onlyOwner idExists(_puzzleId)

The sum of all values sent for the rarities must equal the total number of pieces for the puzzle (X * Y). To properly use this function, the minTokenId and maxTokenId must be retrieved for the puzzle from the PuzzleStructs mapping.

## Example

### Create a group called "Frogs"

addUpdateGroup(true, 0, "Frogs", 1, true)

A new group will be created. When a group is created, the ID (second parameter) is ignored and the next valid ID is generated. 

### Create a 3x5 puzzle calld "Green Frogs" and assign it to the first group

addPuzzle("Green Frogs", 3, 5, true, 1, 1)

### Get min/max token IDs for the puzzle

var puzzle = await contract.PuzzleStructs.call(1)
var minId = puzzle.minTokenId;
var maxId = puzzle.maxTokenId;

### Assign rarities
Using minId and maxId above. Assuming the minId = 1 and maxId = 15. The next puzzle will have pieces with a minId = 16.

puzzleInit(1, [1,2,3,4,5], [6,7,8,9], [10,11,12], [13,14], [15])

