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

    it("should succeed and queue proposal withdrawal, then execute it after delay", async function () {
      // Create proposal (100 USDC withdrawal, which is > 50 USDC threshold)
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

      // Execute proposal (this will queue withdrawal in treasury)
      await expect(governor.execute(1n))
        .to.emit(governor, "ProposalExecuted")
        .to.emit(treasury, "WithdrawalQueued");

      // Verify withdrawal is queued in treasury
      const queued = await treasury.queuedWithdrawals(1n);
      expect(queued.recipient).to.equal(executionTarget.address);
      expect(queued.amount).to.equal(treasuryImpact);
      expect(queued.executed).to.be.false;

      // Verify target balance has NOT changed yet
      const initialTargetBalance = await mockUSDC.balanceOf(executionTarget.address);
      expect(initialTargetBalance).to.equal(0n);

      // Try executing withdrawal before timelock (should revert)
      await expect(treasury.executeWithdrawal(1n)).to.be.revertedWith("Timelock not expired");

      // Fast-forward past treasury delay (1 day = 86400s)
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine", []);

      // Execute withdrawal
      await expect(treasury.executeWithdrawal(1n))
        .to.emit(treasury, "WithdrawalExecuted")
        .to.emit(treasury, "WithdrawalUSDC");

      // Verify funds were transferred to target address
      const finalTargetBalance = await mockUSDC.balanceOf(executionTarget.address);
      expect(finalTargetBalance).to.equal(treasuryImpact);

      state = await governor.state(1n);
      expect(state).to.equal(7); // 7 = Executed
    });

    it("should require 66% supermajority for large withdrawals (>50 USDC) and fail if simple majority is not enough", async function () {
      // Transfer more voting tokens to voter2 to have 600 votes
      await token.transfer(voter2.address, 100n * 10n ** 18n);
      await token.connect(voter2).delegate(voter2.address);
      await ethers.provider.send("evm_mine", []);

      // Create proposal (100 USDC withdrawal, which is > 50 USDC threshold)
      await governor.propose(
        proposalTitle,
        proposalDesc,
        proposalCategory,
        duration,
        treasuryImpact,
        executionTarget.address
      );

      // Vote: Voter1 (1000 votes) For, Voter2 (600 votes) Against
      // Total For: 1000 (62.5%), Total Against: 600 (37.5%).
      // Simple majority (1000 > 600) is true, but supermajority (62.5% < 66%) is false.
      await governor.connect(voter1).castVote(1n, 1); // 1 = For
      await governor.connect(voter2).castVote(1n, 0); // 0 = Against

      // Fast-forward time past end time + execution delay
      await ethers.provider.send("evm_increaseTime", [duration + EXECUTION_DELAY + 10]);
      await ethers.provider.send("evm_mine", []);

      // Proposal state should be Defeated because it failed the supermajority check
      const state = await governor.state(1n);
      expect(state).to.equal(3); // 3 = Defeated

      // Try executing (should revert)
      await expect(governor.execute(1n)).to.be.revertedWith("Proposal cannot be executed");
    });

    it("should allow emergency pause and cancellation of withdrawals by owner", async function () {
      // Create and execute a passed proposal to queue a withdrawal
      await governor.propose(
        proposalTitle,
        proposalDesc,
        proposalCategory,
        duration,
        treasuryImpact,
        executionTarget.address
      );
      await governor.connect(voter1).castVote(1n, 1);
      
      await ethers.provider.send("evm_increaseTime", [duration + EXECUTION_DELAY + 10]);
      await ethers.provider.send("evm_mine", []);

      await governor.execute(1n); // Queues withdrawal #1

      // Pause the treasury
      await treasury.pause();

      // Try to execute withdrawal while paused (should revert)
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine", []);
      await expect(treasury.executeWithdrawal(1n)).to.be.revertedWithCustomError(treasury, "EnforcedPause");

      // Cancel the withdrawal
      await expect(treasury.cancelWithdrawal(1n))
        .to.emit(treasury, "WithdrawalCanceled");

      // Unpause the treasury
      await treasury.unpause();

      // Try to execute the canceled withdrawal (should revert)
      await expect(treasury.executeWithdrawal(1n)).to.be.revertedWith("Canceled");
    });
  });
});
