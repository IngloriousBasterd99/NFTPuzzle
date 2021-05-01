pragma solidity ^0.7.0;

// SPDX-License-Identifier: UNLICENSED

import "openzeppelin-solidity/contracts/access/Ownable.sol";
import '@0xsequence/erc-1155/contracts/tokens/ERC1155/ERC1155.sol';
import '@0xsequence/erc-1155/contracts/tokens/ERC1155/ERC1155Metadata.sol';
import '@0xsequence/erc-1155/contracts/tokens/ERC1155/ERC1155MintBurn.sol';
import "./Strings.sol";

contract OwnableDelegateProxyWithCreators { }

contract ProxyRegistryWithCreators {
  mapping(address => OwnableDelegateProxyWithCreators) public proxies;
}

/** @title ERC1155Tradable
 * ERC1155Tradable - ERC1155 contract that whitelists an operator address, has create and mint functionality, and supports useful standards from OpenZeppelin,
  like _exists(), name(), symbol(), and totalSupply() */
contract ERC1155TradableWithCreators is ERC1155, ERC1155MintBurn, ERC1155Metadata, Ownable {
  using Strings for string;

  address proxyRegistryAddress;
  uint256 private _currentTokenID = 0;
  mapping (uint256 => address) public creators;
  mapping (uint256 => uint256) public tokenSupply;
  string public contractName;
  string public contractSymbol;

  function supportsInterface(bytes4 _interfaceID) public override(ERC1155, ERC1155Metadata) pure returns (bool) {
    return super.supportsInterface(_interfaceID);
  }
  
  /** @dev Require msg.sender to be the creator of the token id */
  modifier creatorOnly(uint256 _id) {
    require(creators[_id] == msg.sender, "ERC1155Tradable#creatorOnly: ONLY_CREATOR_ALLOWED");
    _;
  }

  constructor(string memory _name, string memory _symbol, address _proxyRegistryAddress) {
    contractName = _name;
    contractSymbol = _symbol;
    proxyRegistryAddress = _proxyRegistryAddress;
  }

  function uri(uint256 _id) public virtual override view returns (string memory) {
    require(_exists(_id), "ERC721Tradable#uri: NONEXISTENT_TOKEN");
    return Strings.strConcat(baseMetadataURI, Strings.uint2str(_id));
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

  /**
    * @dev Creates a new token type and assigns _initialSupply to an address
    * NOTE: remove onlyOwner if you want third parties to create new tokens on your contract (which may change your IDs)
    * @param _initialOwner address of the first owner of the token
    * @param _initialSupply amount to supply the first owner
    * @param _uri Optional URI for this token type
    * @param _data Data to pass if receiver is contract
    * @return The newly created token ID
    */
  function create(
    address _initialOwner,
    uint256 _initialSupply,
    string calldata _uri,
    bytes calldata _data
  ) external onlyOwner returns (uint256) {

    uint256 _id = _getNextTokenID();
    _incrementTokenTypeId();
    creators[_id] = msg.sender;

    if (bytes(_uri).length > 0) {
      emit URI(_uri, _id);
    }

    _mint(_initialOwner, _id, _initialSupply, _data);
    tokenSupply[_id] = _initialSupply;
    return _id;
  }

  /**
    * @dev Mints some amount of tokens to an address
    * @param _to          Address of the future owner of the token
    * @param _id          Token ID to mint
    * @param _quantity    Amount of tokens to mint
    * @param _data        Data to pass if receiver is contract
    */
  function mint(
    address _to,
    uint256 _id,
    uint256 _quantity,
    bytes memory _data
  ) public creatorOnly(_id) {
    _mint(_to, _id, _quantity, _data);
    tokenSupply[_id] = tokenSupply[_id] + _quantity;
  }

  /**
    * @dev Mint tokens for each id in _ids
    * @param _to          The address to mint tokens to
    * @param _ids         Array of ids to mint
    * @param _quantities  Array of amounts of tokens to mint per id
    * @param _data        Data to pass if receiver is contract
    */
  function batchMint(
    address _to,
    uint256[] memory _ids,
    uint256[] memory _quantities,
    bytes memory _data
  ) public {
    for (uint256 i = 0; i < _ids.length; i++) {
      uint256 _id = _ids[i];
      require(creators[_id] == msg.sender, "ERC1155Tradable#batchMint: ONLY_CREATOR_ALLOWED");
      uint256 quantity = _quantities[i];
      tokenSupply[_id] = tokenSupply[_id] + quantity;
    }
    _batchMint(_to, _ids, _quantities, _data);
  }

  /**
    * @dev Change the creator address for given tokens
    * @param _to   Address of the new creator
    * @param _ids  Array of Token IDs to change creator
    */
  function setCreator(
    address _to,
    uint256[] memory _ids
  ) public {
    require(_to != address(0), "ERC1155Tradable#setCreator: INVALID_ADDRESS.");
    for (uint256 i = 0; i < _ids.length; i++) {
      uint256 id = _ids[i];
      _setCreator(_to, id);
    }
  }

  /**
   * Override isApprovedForAll to whitelist user's OpenSea proxy accounts to enable gas-free listings.
   */
  function isApprovedForAll(
    address _owner,
    address _operator
  ) public view override returns (bool isOperator) {
    // Whitelist OpenSea proxy contract for easy trading.
    ProxyRegistryWithCreators proxyRegistry = ProxyRegistryWithCreators(proxyRegistryAddress);
    if (address(proxyRegistry.proxies(_owner)) == _operator) {
      return true;
    }

    return ERC1155.isApprovedForAll(_owner, _operator);
  }

  /**
    * @dev Change the creator address for given token
    * @param _to   Address of the new creator
    * @param _id  Token IDs to change creator of
    */
  function _setCreator(address _to, uint256 _id) internal creatorOnly(_id)
  {
      creators[_id] = _to;
  }

  /**
    * @dev Returns whether the specified token exists by checking to see if it has a creator
    * @param _id uint256 ID of the token to query the existence of
    * @return bool whether the token exists
    */
  function _exists(
    uint256 _id
  ) internal view returns (bool) {
    return creators[_id] != address(0);
  }

  /**
    * @dev calculates the next token ID based on value of _currentTokenID
    * @return uint256 for the next token ID
    */
  function _getNextTokenID() private view returns (uint256) {
    return _currentTokenID + 1;
  }

  /**
    * @dev increments the value of _currentTokenID
    */
  function _incrementTokenTypeId() private  {
    _currentTokenID++;
  }

  /** @dev Mint tokens, generating id for each value in _quantities
    * @param _to          The address to mint tokens to
    * @param _quantities  Array of amounts of tokens to mint per id
    * @param _data        Data to pass if receiver is contract
    * returns array of id */  
  function batchMintWithNoId(address _to, uint256[] memory _quantities, bytes memory _data) public onlyOwner returns (uint256[] memory) {
    uint256[] memory _ids = new uint256[](_quantities.length);
    for (uint256 i = 0; i < _quantities.length; i++) {
      _incrementTokenTypeId();
      _ids[i] = _currentTokenID;
    }
    batchMint(_to, _ids, _quantities, _data);
    return _ids;
  }

  /** @dev Mints some amount of tokens to an address, generating a new token id
    * @param _to          Address of the future owner of the token
    * @param _quantity    Amount of tokens to mint
    * @param _data        Data to pass if receiver is contract
    * returns id*/
  function mintWithNoId(address _to, uint256 _quantity, bytes memory _data) public onlyOwner returns (uint256) {
    _incrementTokenTypeId();
    mint(_to, _currentTokenID, _quantity, _data);
    return _currentTokenID;
  }    
}
