import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer, Contract } from "ethers";

describe("SynArc Governance System", function () {
  let token: any;
  let treasury: any;
  let governor: any;
  let mockUSDC: any;
  let mockEURC: any;

  let owner: any;
  let voter1: any;
  let voter2: any;
  let executionTarget: any;

  const INITIAL_SUPPLY = 15000000n * 10n ** 18n;
  const EXECUTION_DELAY = 172800; // 2 days in seconds

  beforeEach(async function () {
    // Get signers
    [owner, voter1, voter2, executionTarget] = await ethers.getSigners();

    // Deploy Mock USDC & EURC
    const MockERC20 = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockERC20.deploy();
    mockEURC = await MockERC20.deploy();

    // Deploy SynArcToken
    const SynArcToken = await ethers.getContractFactory("SynArcToken");
    token = await SynArcToken.deploy();

    // Deploy SynArcTreasury
    const SynArcTreasury = await ethers.getContractFactory("SynArcTreasury");
    treasury = await SynArcTreasury.deploy(await mockUSDC.getAddress(), await mockEURC.getAddress());

    // Deploy SynArcGovernor
    const SynArcGovernor = await ethers.getContractFactory("SynArcGovernor");
    governor = await SynArcGovernor.deploy(
      await token.getAddress(),
      await treasury.getAddress(),
      EXECUTION_DELAY
    );

    // Configure Governor in Treasury
    await treasury.setGovernor(await governor.getAddress());
  });

  describe("SynArcToken", function () {
    it("should have correct initial supply minted to owner", async function () {
      const balance = await token.balanceOf(owner.address);
      expect(balance).to.equal(INITIAL_SUPPLY);
    });

    it("should allow owner to mint tokens", async function () {
      const mintAmount = 1000n * 10n ** 18n;
      await token.mint(voter1.address, mintAmount);
      const balance = await token.balanceOf(voter1.address);
      expect(balance).to.equal(mintAmount);
    });

    it("should reject non-owner minting", async function () {
      const mintAmount = 1000n * 10n ** 18n;
      await expect(
        token.connect(voter1).mint(voter2.address, mintAmount)
      ).to.be.reverted;
    });

    it("should track voting power after delegation", async function () {
      // Transfer tokens to voter1
      const transferAmount = 1000n * 10n ** 18n;
      await token.transfer(voter1.address, transferAmount);

      // Check voting power before delegation (should be 0)
      let votes = await token.getVotes(voter1.address);
      expect(votes).to.equal(0n);

      // Voter1 delegates to themselves
      await token.connect(voter1).delegate(voter1.address);

      // Check voting power after delegation (should equal balance)
      votes = await token.getVotes(voter1.address);
      expect(votes).to.equal(transferAmount);
    });
  });

  describe("SynArcTreasury", function () {
    const depositAmount = 500n * 10n ** 6n; // 6 decimals for mock USDC

    beforeEach(async function () {
      // Mint mock USDC to owner and approve treasury
      await mockUSDC.mint(owner.address, depositAmount);
      await mockUSDC.approve(await treasury.getAddress(), depositAmount);
    });

    it("should allow deposits of USDC", async function () {
      await treasury.depositUSDC(depositAmount);
      expect(await treasury.usdcBalance()).to.equal(depositAmount);
    });

    it("should reject withdrawals from non-governor", async function () {
      await treasury.depositUSDC(depositAmount);
      await expect(
        treasury.connect(voter1).withdrawUSDC(executionTarget.address, depositAmount)
      ).to.be.revertedWith("Only governor can call");
    });
  });

  describe("SynArcGovernor", function () {
    const proposalTitle = "Creator Fund Proposal";
    const proposalDesc = "Fund creator workspace improvements";
    const proposalCategory = "Funding";
    const duration = 86400; // 1 day
    const treasuryImpact = 100n * 10n ** 6n; // 100 USDC

    beforeEach(async function () {
      // Setup treasury funds
      await mockUSDC.mint(owner.address, treasuryImpact);
      await mockUSDC.approve(await treasury.getAddress(), treasuryImpact);
      await treasury.depositUSDC(treasuryImpact);

      // Distribute token shares for voting power
      await token.transfer(voter1.address, 1000n * 10n ** 18n);
      await token.transfer(voter2.address, 500n * 10n ** 18n);

      // Delegate voting power (needed for snapshot tracking)
      await token.connect(voter1).delegate(voter1.address);
      await token.connect(voter2).delegate(voter2.address);

      // Mine a block to checkpoint voting power snapshot
      await ethers.provider.send("evm_mine", []);
    });

    it("should allow creating proposals", async function () {
      await expect(
        governor.propose(
          proposalTitle,
          proposalDesc,
          proposalCategory,
          duration,
          treasuryImpact,
          executionTarget.address
        )
      ).to.emit(governor, "ProposalCreated");

      const count = await governor.proposalCount();
      expect(count).to.equal(1n);
    });

    it("should track proposal states and voting", async function () {
      // Create proposal
      await governor.propose(
        proposalTitle,
        proposalDesc,
        proposalCategory,
        duration,
        treasuryImpact,
        executionTarget.address
      );

      // Get proposal state (should be Active)
      let state = await governor.state(1n);
      expect(state).to.equal(1); // 1 = Active

      // Cast vote
      await expect(governor.connect(voter1).castVote(1n, 1)) // 1 = For
        .to.emit(governor, "VoteCast")
        .withArgs(voter1.address, 1n, 1, 1000n * 10n ** 18n, "");

      const proposal = await governor.proposals(1n);
      expect(proposal.forVotes).to.equal(1000n * 10n ** 18n);

      // Try double voting (should revert)
      await expect(governor.connect(voter1).castVote(1n, 1)).to.be.revertedWith(
        "Already voted"
      );
    });

    it("should succeed and execute proposal to withdraw funds from treasury", async function () {
      // Create proposal
      await governor.propose(
        proposalTitle,
        proposalDesc,
        proposalCategory,
        duration,
        treasuryImpact,
        executionTarget.address
      );

      // Vote For
      await governor.connect(voter1).castVote(1n, 1);

      // Fast-forward time past end time but before execution delay (should be Queued)
      await ethers.provider.send("evm_increaseTime", [duration + 10]);
      await ethers.provider.send("evm_mine", []);
      
      let state = await governor.state(1n);
      expect(state).to.equal(5); // 5 = Queued

      // Fast-forward past execution delay (should be Succeeded)
      await ethers.provider.send("evm_increaseTime", [EXECUTION_DELAY]);
      await ethers.provider.send("evm_mine", []);

      state = await governor.state(1n);
      expect(state).to.equal(4); // 4 = Succeeded

      // Execute proposal
      const initialTargetBalance = await mockUSDC.balanceOf(executionTarget.address);
      
      await expect(governor.execute(1n))
        .to.emit(governor, "ProposalExecuted")
        .to.emit(treasury, "WithdrawalUSDC");

      // Verify funds were transferred to target address
      const finalTargetBalance = await mockUSDC.balanceOf(executionTarget.address);
      expect(finalTargetBalance - initialTargetBalance).to.equal(treasuryImpact);

      state = await governor.state(1n);
      expect(state).to.equal(7); // 7 = Executed
    });
  });
});
