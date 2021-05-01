const truffleAssert = require('truffle-assertions');
const vals = require('../lib/testValuesCommon.js');
const ERC1155Tradable = artifacts.require("../contracts/ERC1155Tradable.sol");
const MockProxyRegistry = artifacts.require("../contracts/test/MockProxyRegistry.sol");
const toBN = web3.utils.toBN;

contract("ERC1155Tradable - ERC 1155", (accounts) => {
    const NAME = 'ERC-1155 Test Contract';
    const SYMBOL = 'ERC1155Test';
  
    const INITIAL_TOKEN_ID = 1;
    const NON_EXISTENT_TOKEN_ID = 99999999;
    const MINT_AMOUNT = toBN(100);
  
    const OVERFLOW_NUMBER = toBN(2, 10).pow(toBN(256, 10)).sub(toBN(1, 10));
  
    const owner = accounts[0];
    const creator = accounts[1];
    const userA = accounts[2];
    const userB = accounts[3];
    const proxyForOwner = accounts[5];
  
    let instance;
    let proxy;
  
    // Keep track of token ids as we progress through the tests, rather than
    // hardcoding numbers that we will have to change if we add/move tests.
    // For example if test A assumes that it will create token ID 1 and test B
    // assumes that it will create token 2, changing test A later so that it
    // creates another token will break this as test B will now create token ID 3.
    // Doing this avoids this scenario.
    let tokenId = 0;
  
    // Because we need to deploy and use a mock ProxyRegistry, we deploy our own
    // instance of ERC1155Tradable instead of using the one that Truffle deployed.
    
    before(async () => {
      proxy = await MockProxyRegistry.new();
      await proxy.setProxy(owner, proxyForOwner);
      instance = await ERC1155Tradable.new(NAME, SYMBOL, proxy.address);
    });
  
    describe('#constructor()', () => {
      it('should set the token name and symbol', async () => {
        const name = await instance.contractName();
        assert.equal(name, NAME);
        const symbol = await instance.contractSymbol();
        assert.equal(symbol, SYMBOL);
        // We cannot check the proxyRegistryAddress as there is no accessor for it
      });
    });

    describe('#mint()', () => {
      it('should allow the contract owner to mint tokens with zero supply',
          async () => {
            tokenId += 1;
            await instance.mint(owner, tokenId, 0, "0x0", { from : owner});
            const supply = await instance.tokenSupply(tokenId);
            assert.ok(supply.eq(toBN(0)));
          });
  
      it('should allow the contract owner to mint tokens with initial supply',
          async () => {
            tokenId += 1;
            await instance.mint(owner, tokenId, MINT_AMOUNT, "0x0", { from : owner});
            const supply = await instance.tokenSupply(tokenId);
            assert.ok(supply.eq(toBN(MINT_AMOUNT)));
          });
  
      // We check some of this in the other create() tests but this makes it
      // explicit and is more thorough.
      it('should set tokenSupply on mint',
          async () => {
            tokenId += 1;
            await instance.mint(owner, tokenId, 33, "0x0", { from : owner});
            const balance = await instance.balanceOf(owner, tokenId);
            assert.ok(balance.eq(toBN(33)));
            const supply = await instance.tokenSupply(tokenId);
            assert.ok(supply.eq(toBN(33)));
            assert.ok(supply.eq(balance));
          });
  
      it('should not allow a non-owner to mint tokens',
          async () => {
            truffleAssert.fails(
              instance.mint(userA, 0, 0, "0x0", { from: userA }),
              truffleAssert.ErrorType.revert,
              'caller is not the owner'
            );
          });               
    });  
      
    describe('#totalSupply()', () => {
      it('should return correct value for token supply',
          async () => {
            tokenId += 1;
            await instance.mint(owner, tokenId, MINT_AMOUNT, "0x0", { from: owner });
            const balance = await instance.balanceOf(owner, tokenId);
            assert.ok(balance.eq(MINT_AMOUNT));
            // Use the created getter for the map
            const supplyGetterValue = await instance.tokenSupply(tokenId);
            assert.ok(supplyGetterValue.eq(MINT_AMOUNT));
            // Use the hand-crafted accessor
            const supplyAccessorValue = await instance.totalSupply(tokenId);
            assert.ok(supplyAccessorValue.eq(MINT_AMOUNT));
  
            // Make explicitly sure everything mateches
            assert.ok(supplyGetterValue.eq(balance));
            assert.ok(supplyAccessorValue.eq(balance));
          });
  
      it('should return zero for non-existent token',
          async () => {
            const balanceValue = await instance.balanceOf(
              owner,
              NON_EXISTENT_TOKEN_ID
            );
            assert.ok(balanceValue.eq(toBN(0)));
            const supplyAccessorValue = await instance.totalSupply(
              NON_EXISTENT_TOKEN_ID
            );
            assert.ok(supplyAccessorValue.eq(toBN(0)));
          });
    });

    describe('#batchMint()', () => {
      it('should correctly set totalSupply',
          async () => {
            tokenId += 1;
            await instance.batchMint(userA, [tokenId], [MINT_AMOUNT], "0x0", { from: owner });
            const supply = await instance.totalSupply(tokenId);
            assert.isOk(supply.eq(MINT_AMOUNT));
          });
  
      it('should require that caller is owner',
          async () => truffleAssert.fails(
            instance.batchMint(userA, [INITIAL_TOKEN_ID], [MINT_AMOUNT], "0x0", { from: userB }),
            truffleAssert.ErrorType.revert,
            'caller is not the owner'
          ));
    });  
    
    describe ('#setBaseMetadataURI()', () => {
      it('should allow the owner to set the base metadata url', async () =>
         truffleAssert.passes(
           instance.setBaseMetadataURI(vals.URI_BASE, { from: owner })
         ));
  
      it('should not allow non-owner to set the base metadata url', async () =>
         truffleAssert.fails(
           instance.setBaseMetadataURI(vals.URI_BASE, { from: userA }),
           truffleAssert.ErrorType.revert,
           'Ownable: caller is not the owner'
         ));
    });  
    
    describe ('#uri()', () => {
      it('should return the correct uri for a token', async () => {
        const uriTokenId = 1;
        const uri = await instance.uri(uriTokenId);
        assert.equal(uri, `${vals.URI_BASE}${uriTokenId}`);
      });
    });

    describe('#isApprovedForAll()', () => {
      it('should approve proxy address as _operator', async () => {
        assert.isOk(
          await instance.isApprovedForAll(owner, proxyForOwner)
        );
      });
  
      it('should not approve non-proxy address as _operator', async () => {
        assert.isNotOk(
          await instance.isApprovedForAll(owner, userB)
        );
      });
  
      it('should reject proxy as _operator for non-owner _owner', async () => {
        assert.isNotOk(
          await instance.isApprovedForAll(userA, proxyForOwner)
        );
      });
  
      it('should accept approved _operator for _owner', async () => {
        await instance.setApprovalForAll(userB, true, { from: userA });
        assert.isOk(await instance.isApprovedForAll(userA, userB));
        // Reset it here
        await instance.setApprovalForAll(userB, false, { from: userA });
      });
  
      it('should not accept non-approved _operator for _owner', async () => {
        await instance.setApprovalForAll(userB, false, { from: userA });
        assert.isNotOk(await instance.isApprovedForAll(userA, userB));
      });
    });
      
})