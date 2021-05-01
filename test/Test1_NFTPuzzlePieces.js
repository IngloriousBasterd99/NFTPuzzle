const truffleAssert = require('truffle-assertions');
const NFTPuzzlePieces = artifacts.require("../contracts/NFTPuzzlePieces.sol");
const Groups = artifacts.require("../contracts/Groups.sol");

contract("NFTPuzzlePieces", (accounts) => {
  const URI_BASE = 'https://nftpuzzle.cat/nft/';
  const CONTRACT_URI = `http://nftpuzzle.cat/contract/nftpuzzle`;
  let instance;
  const DEFAULT_WEIGHT = 2;
  const DEFAULT_GROUPNAME = "test";
  const DEFAULT_GROUPNAME2 = "test2";
  const DEFAULT_PUZZLENAME = "puzzleTest"
  const DEFAULT_PUZZLENAME2 = "puzzleTest2"
  const owner = accounts[0];
  const userA = accounts[1];

  before(async () => {
    instance = await NFTPuzzlePieces.deployed();
  });

  describe('#constructor()', () => {
    it('should set the contractURI to the supplied value', async () => {
      assert.equal(await instance.contractURI(), CONTRACT_URI);
    });
  });

  describe('#addUpdateGroup()', () => {
    it('should not allow a non-owner to insert a group', async () => {
      await truffleAssert.fails(
        instance.addUpdateGroup(true, 0, DEFAULT_GROUPNAME, DEFAULT_WEIGHT, true, { from: userA }),
        truffleAssert.ErrorType.revert,
        'caller is not the owner'
      );
    });  

    it('should not allow a blank title', async () => {
      await truffleAssert.fails(
        instance.addUpdateGroup(true, 0, "", DEFAULT_WEIGHT, true, { from: owner }),
        truffleAssert.ErrorType.revert,
        '_title cannot be blank'
      );
    });      

    it('should not allow a weight of 0', async () => {
      await truffleAssert.fails(
        instance.addUpdateGroup(true, 0, DEFAULT_GROUPNAME, 0, true, { from: owner }),
        truffleAssert.ErrorType.revert,
        '_weight must be greater than 0'
      );
    });    
    
    it('should not allow updating a group with an id greater than the number of groups', async () => {
      await truffleAssert.fails(
        instance.addUpdateGroup(false, 1, DEFAULT_GROUPNAME, DEFAULT_WEIGHT, true, { from: owner }),
        truffleAssert.ErrorType.revert,
        '_id must be lower than number of groups'
      );
    });   
    
    it('should not allow updating a group when there are no groups', async () => {
      await truffleAssert.fails(
        instance.addUpdateGroup(false, 0, DEFAULT_GROUPNAME, DEFAULT_WEIGHT, true, { from: owner }),
        truffleAssert.ErrorType.revert,
        '_id must be lower than number of groups'
      );
    }); 
    
    it('should insert a group correctly', async () => {
      await instance.addUpdateGroup(true, 0, DEFAULT_GROUPNAME, DEFAULT_WEIGHT, true, { from : owner});
      const pc = await instance.groupCount();
      assert.equal(pc, 1, "groupCount is not correct");

      const group = await instance.GroupStructs.call(1);
      assert.equal(DEFAULT_GROUPNAME, group[0], "title is not set correctly");
      assert.equal(DEFAULT_WEIGHT, group[1], "weight is not set correctly");
      assert.equal(true, group[2], "isActive is not set correctly");
    });
    
    it('should update a group correctly', async () => {
      await instance.addUpdateGroup(false, 1, DEFAULT_GROUPNAME, DEFAULT_WEIGHT, true, { from : owner});
      const pc = await instance.groupCount();
      assert.equal(pc, 1, "groupCount is not correct");

      const group = await instance.GroupStructs.call(1);
      assert.equal(DEFAULT_GROUPNAME, group[0], "title is not set correctly");
      assert.equal(DEFAULT_WEIGHT, group[1], "weight is not set correctly");
      assert.equal(true, group[2], "isActive is not set correctly");
    });
  });

  describe('#setGroupActive()', () => {
    it('should not allow a non-owner to set isActive for a group', async () => {
      await truffleAssert.fails(
        instance.setGroupActive(1, true, { from: userA }),
        truffleAssert.ErrorType.revert,
        'caller is not the owner'
      );
    });  

    it('should not allow setting isActive for a non-existent group', async () => {
      await truffleAssert.fails(
        instance.setGroupActive(2, true, { from: owner }),
        truffleAssert.ErrorType.revert,
        '_id must be lower than number of groups'
      );
    });  

    it('should set isActive for a group correctly', async () => {
      await instance.setGroupActive(1, true, { from : owner});
      var group = await instance.GroupStructs.call(1);
      assert.equal(group.isActive, true, "isActive is not set to true correctly");
      await instance.setGroupActive(1, false, { from : owner});
      group = await instance.GroupStructs.call(1);
      assert.equal(group.isActive, false, "isActive is not set to false correctly");
    });
  });  

  describe('#addPuzzle()', () => {
    it('should not allow a non-owner to add a puzzle', async () => {
      await truffleAssert.fails(
        instance.addPuzzle(DEFAULT_PUZZLENAME, 3, 3, true, 1, 1, { from: userA }),
        truffleAssert.ErrorType.revert,
        'caller is not the owner'
      );
    });  

    it('should not allow a non-existent group', async () => {
      await truffleAssert.fails(
        instance.addPuzzle(DEFAULT_PUZZLENAME, 3, 4, true, 3, 1, { from: owner }),
        truffleAssert.ErrorType.revert,
        'Invalid group'
      );
    });   
    
    it('should not allow a blank title', async () => {
      await truffleAssert.fails(
        instance.addPuzzle("", 3, 3, true, 1, 1, { from: owner }),
        truffleAssert.ErrorType.revert,
        '_title cannot be blank'
      );
    });      

    it('should not allow a width of 0', async () => {
      await truffleAssert.fails(
        instance.addPuzzle(DEFAULT_PUZZLENAME, 0, 3, true, 1, 1, { from: owner }),
        truffleAssert.ErrorType.revert,
        '_width and _height must be greater than 0'
      );
    });  
    
    it('should not allow a height of 0', async () => {
      await truffleAssert.fails(
        instance.addPuzzle(DEFAULT_PUZZLENAME, 3, 0, true, 1, 1, { from: owner }),
        truffleAssert.ErrorType.revert,
        '_width and _height must be greater than 0'
      );
    });  
    
    it('should not allow a weight of 0', async () => {
      await truffleAssert.fails(
        instance.addPuzzle(DEFAULT_PUZZLENAME, 3, 5, true, 1, 0, { from: owner }),
        truffleAssert.ErrorType.revert,
        '_weight must be greater than 0'
      );
    });    
       
    it('should insert a puzzle correctly', async () => {
      await instance.addPuzzle(DEFAULT_PUZZLENAME, 3, 5, true, 1, 1, { from: owner });
      const pc = await instance.puzzleCount();
      assert.equal(pc, 1, "puzzleCount is not correct");

      const puzzle = await instance.PuzzleStructs.call(1);
      assert.equal(DEFAULT_PUZZLENAME, puzzle[0], "title is not set correctly");
      assert.equal(puzzle.width, 3, "width is not set correctly");
      assert.equal(puzzle.height, 5, "height is not set correctly");
      assert.equal(puzzle.isActive, true, "isActive is not set correctly");
      assert.equal(puzzle.balance, 0, "balance is not set correctly");
      assert.equal(puzzle.group, 1, "group is not set correctly");
      assert.equal(puzzle.minTokenId, 1, "minTokenId is not set correctly");
      assert.equal(puzzle.maxTokenId, 15, "maxTokenId is not set correctly");
      assert.equal(puzzle.weight, 1, "weight is not set correctly");
    });

  });  
  
  describe('#puzzleInit()', () => {
    it('should not allow a non-owner to initialize a puzzle', async () => {
      await truffleAssert.fails(
        instance.puzzleInit(1, [1,2,3,4,5], [6,7,8,9], [10,11,12], [13,14], [15], { from: userA }),
        truffleAssert.ErrorType.revert,
        'caller is not the owner'
      );
    });  

    it('should not allow a non-existent puzzle', async () => {
      await truffleAssert.fails(
        instance.puzzleInit(2, [1,2,3,4,5], [6,7,8,9], [10,11,12], [13,14], [15], { from: owner }),
        truffleAssert.ErrorType.revert,
        '_puzzleId must be lower than number of puzzles'
      );
    });   
    
    it('should not allow sum of rarities to be less than number of pieces', async () => {
      await truffleAssert.fails(
        instance.puzzleInit(1, [1,2,3,4,5], [6,7,8,9], [10,11,12], [13,14], [15,16], { from: owner }),
        truffleAssert.ErrorType.revert,
        'Incorrect number of pieces'
      );
    });       
       
    it('should init a puzzle correctly', async () => {
      await instance.puzzleInit(1, [1,2,3,4,5], [6,7,8,9], [10,11,12], [13,14], [15], { from: owner });
      var token = await instance.getTokenIdByClassForPuzzle(1,0);     
      assert.equal(token[0], 1, "first common token id is not set correctly");
      assert.equal(token[4], 5, "last common token id is not set correctly");

      token = await instance.getTokenIdByClassForPuzzle(1,1);     
      assert.equal(token[0], 6, "first uncommon token id is not set correctly");
      assert.equal(token[3], 9, "last uncommon token id is not set correctly");
      
      token = await instance.getTokenIdByClassForPuzzle(1,2);     
      assert.equal(token[0], 10, "first rare token id is not set correctly");
      assert.equal(token[2], 12, "last rare token id is not set correctly");
      
      token = await instance.getTokenIdByClassForPuzzle(1,3);     
      assert.equal(token[0], 13, "first epic token id is not set correctly");
      assert.equal(token[1], 14, "last epic token id is not set correctly");
      
      token = await instance.getTokenIdByClassForPuzzle(1,4);     
      assert.equal(token[0], 15, "legendary token id is not set correctly");
    });
  });  

  describe('#addUpdateGroup - 2', () => {   
    it('should insert a second group correctly', async () => {
      await instance.addUpdateGroup(true, 0, DEFAULT_GROUPNAME2, DEFAULT_WEIGHT, true, { from : owner});
      const pc = await instance.groupCount();
      assert.equal(pc, 2, "groupCount is not correct");

      const group = await instance.GroupStructs.call(2);
      assert.equal(DEFAULT_GROUPNAME2, group[0], "title is not set correctly");
      assert.equal(DEFAULT_WEIGHT, group[1], "weight is not set correctly");
      assert.equal(true, group[2], "isActive is not set correctly");
    });
    
    it('should update a second group correctly', async () => {
      await instance.addUpdateGroup(false, 2, DEFAULT_GROUPNAME2, DEFAULT_WEIGHT, true, { from : owner});
      const pc = await instance.groupCount();
      assert.equal(pc, 2, "groupCount is not correct");

      const group = await instance.GroupStructs.call(2);
      assert.equal(DEFAULT_GROUPNAME2, group[0], "title is not set correctly");
      assert.equal(DEFAULT_WEIGHT, group[1], "weight is not set correctly");
      assert.equal(true, group[2], "isActive is not set correctly");
    });
  });

  describe('#setGroupActive()', () => {
    it('should not allow a non-owner to set isActive for a group', async () => {
      await truffleAssert.fails(
        instance.setGroupActive(3, true, { from: userA }),
        truffleAssert.ErrorType.revert,
        'caller is not the owner'
      );
    });  

    it('should not allow setting isActive for a non-existent group', async () => {
      await truffleAssert.fails(
        instance.setGroupActive(3, true, { from: owner }),
        truffleAssert.ErrorType.revert,
        '_id must be lower than number of groups'
      );
    });  

    it('should set isActive for a group correctly', async () => {
      await instance.setGroupActive(2, true, { from : owner});
      var group = await instance.GroupStructs.call(2);
      assert.equal(true, group[2], "isActive is not set to true correctly");
      await instance.setGroupActive(2, false, { from : owner});
      group = await instance.GroupStructs.call(2);
      assert.equal(false, group[2], "isActive is not set to false correctly");
    });
  });  

  describe('#setPuzzleGroup()', () => {
    it('should not allow a non-owner to set a puzzle group', async () => {
      await truffleAssert.fails(
        instance.setPuzzleGroup(1, 1, { from: userA }),
        truffleAssert.ErrorType.revert,
        'caller is not the owner'
      );
    });  

    it('should not allow setting a non-existent group', async () => {
      await truffleAssert.fails(
        instance.setPuzzleGroup(1, 3, { from: owner }),
        truffleAssert.ErrorType.revert,
        'Invalid group'
      );
    });   
          
    it('should set a puzzle group correctly', async () => {
      await instance.setPuzzleGroup(1, 2, { from: owner });
      var puzzle = await instance.PuzzleStructs.call(1);
      assert.equal(puzzle.group, 2, "group is not set correctly");
    });

  }); 
  
  describe('#setPuzzleActive()', () => {
    it('should not allow a non-owner to set isActive for a puzzle', async () => {
      await truffleAssert.fails(
        instance.setPuzzleActive(1, true, { from: userA }),
        truffleAssert.ErrorType.revert,
        'caller is not the owner'
      );
    });  

    it('should not allow setting isActive for a non-existent puzzle', async () => {
      await truffleAssert.fails(
        instance.setPuzzleActive(3, true, { from: owner }),
        truffleAssert.ErrorType.revert,
        '_puzzleId must be lower than number of puzzles'
      );
    });  

    it('should set isActive for a puzzle correctly', async () => {
      await instance.setPuzzleActive(1, true, { from : owner});
      var puzzle = await instance.PuzzleStructs.call(1);
      assert.equal(puzzle.isActive, true, "isActive is not set to true correctly");
      await instance.setPuzzleActive(1, false, { from : owner});
      puzzle = await instance.PuzzleStructs.call(1);
      assert.equal(puzzle.isActive, false, "isActive is not set to false correctly");
    });
  });   

  describe('#addPuzzle() - 2', () => {      
    it('should insert a second puzzle correctly', async () => {
      await instance.addPuzzle(DEFAULT_PUZZLENAME2, 4, 5, true, 2, 1, { from: owner });
      const pc = await instance.puzzleCount();
      assert.equal(pc, 2, "puzzleCount is not correct");

      const puzzle = await instance.PuzzleStructs.call(2);
      assert.equal(DEFAULT_PUZZLENAME2, puzzle[0], "title is not set correctly");
      assert.equal(puzzle.width, 4, "width is not set correctly");
      assert.equal(puzzle.height, 5, "height is not set correctly");
      assert.equal(puzzle.isActive, true, "isActive is not set correctly");
      assert.equal(puzzle.balance, 0, "balance is not set correctly");
      assert.equal(puzzle.group, 2, "group is not set correctly");
      assert.equal(puzzle.minTokenId, 16, "minTokenId is not set correctly");
      assert.equal(puzzle.maxTokenId, 35, "maxTokenId is not set correctly");
      assert.equal(puzzle.weight, 1, "weight is not set correctly");
    });
  });   

  describe('#puzzleInit() - 2', () => {
    it('should not allow a non-owner to initialize a puzzle', async () => {
      await truffleAssert.fails(
        instance.puzzleInit(2, [1,2,3,4,5], [6,7,8,9], [10,11,12], [13,14], [15], { from: userA }),
        truffleAssert.ErrorType.revert,
        'caller is not the owner'
      );
    });  

    it('should not allow a non-existent puzzle', async () => {
      await truffleAssert.fails(
        instance.puzzleInit(3, [1,2,3,4,5], [6,7,8,9], [10,11,12], [13,14], [15], { from: owner }),
        truffleAssert.ErrorType.revert,
        '_puzzleId must be lower than number of puzzles'
      );
    });   
    
    it('should not allow sum of rarities to be less than number of pieces', async () => {
      await truffleAssert.fails(
        instance.puzzleInit(2, [1,2,3,4,5], [6,7,8,9], [10,11,12], [13,14], [15,16], { from: owner }),
        truffleAssert.ErrorType.revert,
        'Incorrect number of pieces'
      );
    });       
       
    it('should init a second puzzle correctly', async () => {
      await instance.puzzleInit(2, [16,17,18,19,20,21,22,23,24], [25,26,27,28,29,30,31], [32,33,34,35], [], [], { from: owner });
      var token = await instance.getTokenIdByClassForPuzzle(2,0);     
      assert.equal(token[0], 16, "first common token id is not set correctly");
      assert.equal(token[8], 24, "last common token id is not set correctly");

      token = await instance.getTokenIdByClassForPuzzle(2,1);     
      assert.equal(token[0], 25, "first uncommon token id is not set correctly");
      assert.equal(token[6], 31, "last uncommon token id is not set correctly");
      
      token = await instance.getTokenIdByClassForPuzzle(2,2);     
      assert.equal(token[0], 32, "first rare token id is not set correctly");
      assert.equal(token[3], 35, "last rare token id is not set correctly");
    });
  });  
});
