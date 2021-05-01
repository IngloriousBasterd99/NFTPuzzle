pragma solidity ^0.7.0;

// SPDX-License-Identifier: UNLICENSED
import "openzeppelin-solidity/contracts/access/Ownable.sol";

contract Groups is Ownable{
  constructor() {}

  struct Group {
    string title;
    uint256 weight;
    bool isActive;
  }
  mapping (uint256 => Group) public GroupStructs;
  uint256 public groupCount = 0;

  modifier groupIdExists(bool _isNew, uint256 _id) {
    require(_isNew || (groupCount > 0 && groupCount >= _id), "_id must be lower than number of groups");
    _;
  }

  function addUpdateGroup(bool _isNew, uint256 _id, string memory _title, uint256 _weight, bool _isActive) public onlyOwner groupIdExists(_isNew, _id) {
    require(bytes(_title).length > 0, "_title cannot be blank");
    require(_weight > 0, "_weight must be greater than 0");
    if (!_isNew) 
    {
      require(groupCount > 0, "No groups to update");
      require(groupCount > 0 && _id <= groupCount, "_id is greater than the number of groups");
    }
    else
      _id = _incrementGroupCount();
    GroupStructs[_id].title = _title;
    GroupStructs[_id].weight = _weight;
    GroupStructs[_id].isActive = _isActive;
  }

  function _incrementGroupCount() private returns(uint) {
    groupCount++;
    return groupCount;
  }    

  function setGroupActive(uint256 _id, bool _isActive) public onlyOwner groupIdExists(false, _id) {
    GroupStructs[_id].isActive = _isActive;
  }
}
