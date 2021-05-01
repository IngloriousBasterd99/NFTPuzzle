pragma solidity ^0.7.0;

// SPDX-License-Identifier: UNLICENSED

import "openzeppelin-solidity/contracts/access/Ownable.sol";
import '@0xsequence/erc-1155/contracts/tokens/ERC1155/ERC1155.sol';
import '@0xsequence/erc-1155/contracts/tokens/ERC1155/ERC1155Metadata.sol';
import '@0xsequence/erc-1155/contracts/tokens/ERC1155/ERC1155MintBurn.sol';
import "./Strings.sol";

contract OwnableDelegateProxy { }

contract ProxyRegistry {
  mapping(address => OwnableDelegateProxy) public proxies;
}

/** @title ERC1155Tradable
 * ERC1155Tradable - ERC1155 contract that whitelists an operator address, has create and mint functionality, and supports useful standards from OpenZeppelin,
  like _exists(), name(), symbol(), and totalSupply() */
contract ERC1155Tradable is ERC1155, ERC1155MintBurn, ERC1155Metadata, Ownable {
  using Strings for string;

  address proxyRegistryAddress;
  uint256 private _currentTokenID = 0;
  mapping (uint256 => uint256) public tokenSupply;
  string public contractName;
  string public contractSymbol;

  function supportsInterface(bytes4 _interfaceID) public override(ERC1155, ERC1155Metadata) pure returns (bool) {
    return super.supportsInterface(_interfaceID);
  }
  
  constructor(string memory _name, string memory _symbol, address _proxyRegistryAddress) {
    contractName = _name;
    contractSymbol = _symbol;
    proxyRegistryAddress = _proxyRegistryAddress;
  }

  /** @dev Returns the total quantity for a token ID
    * @param _id uint256 ID of the token to query
    * @return amount of token in existence */
  function totalSupply(uint256 _id) public view returns (uint256) {
    return tokenSupply[_id];
  }

  /** @dev Will update the base URL of token's URI @param _newBaseMetadataURI New base URL of token's URI */
  function setBaseMetadataURI(string memory _newBaseMetadataURI) public onlyOwner {
    _setBaseMetadataURI(_newBaseMetadataURI);
  }

  function uri(uint256 _id) public virtual override view returns (string memory) {
    return Strings.strConcat(baseMetadataURI, Strings.uint2str(_id));
  }

  /** @dev Mints some amount of tokens to an address
    * @param _to          Address of the future owner of the token
    * @param _id          Token ID to mint
    * @param _quantity    Amount of tokens to mint
    * @param _data        Data to pass if receiver is contract */
  function mint(address _to, uint256 _id, uint256 _quantity, bytes memory _data) public onlyOwner {
    _setMaxTokenId(_id);
    _mint(_to, _id, _quantity, _data);
    tokenSupply[_id] = tokenSupply[_id] + _quantity;
  }

  /** @dev Mint tokens for each id in _ids
    * @param _to          The address to mint tokens to
    * @param _ids         Array of ids to mint
    * @param _quantities  Array of amounts of tokens to mint per id
    * @param _data        Data to pass if receiver is contract */
  function batchMint(address _to, uint256[] memory _ids, uint256[] memory _quantities, bytes memory _data) public onlyOwner {
    for (uint256 i = 0; i < _ids.length; i++) {
      uint256 _id = _ids[i];
      uint256 quantity = _quantities[i];
      tokenSupply[_id] = tokenSupply[_id] + quantity;
      _setMaxTokenId(_id);
    }
    _batchMint(_to, _ids, _quantities, _data);
  }

  /** Override isApprovedForAll to whitelist user's OpenSea proxy accounts to enable gas-free listings. */
  function isApprovedForAll(address _owner, address _operator) public view override returns (bool isOperator) {
    // Whitelist OpenSea proxy contract for easy trading.
    ProxyRegistry proxyRegistry = ProxyRegistry(proxyRegistryAddress);
    if (address(proxyRegistry.proxies(_owner)) == _operator) {
      return true;
    }

    return ERC1155.isApprovedForAll(_owner, _operator);
  }

  /** @dev increments the value of _currentTokenID */
  function _incrementTokenTypeId() private  {
    _currentTokenID++;
  }

  function _setMaxTokenId(uint _id) private {
    if (_id > _currentTokenID) 
      _currentTokenID = _id; //update _currentTokenId
  }

  /* returns min/max token ids */
  function _getTokenIds(uint _quantity) internal returns (uint[2] memory) {
    uint minTokenId = _currentTokenID + 1;
    _setMaxTokenId(_currentTokenID + _quantity);
    uint[2] memory result = [minTokenId, _currentTokenID];
    return result;
  }
}
