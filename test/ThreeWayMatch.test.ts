import { expect } from "chai";
import { ethers } from "hardhat";

describe("Three-Way Match, Payee Substitution Defense & Adversarial Verification", function () {
  let token: any;
  let treasury: any;
  let governor: any;
  let mockUSDC: any;
  let mockEURC: any;

  let owner: any;
  let proposer: any;
  let payeeVendor: any;
  let attackerTarget: any;
  let reviewer: any;

  const INITIAL_SUPPLY = 15000000n * 10n ** 18n;
  const EXECUTION_DELAY = 172800; // 2 days
  const DEPOSIT_AMOUNT = 10000n * 10n ** 6n; // 10,000 USDC

  // Expected deliverable IPFS CID and its keccak256 hash (verified Pinata pinned document)
  const DELIVERABLE_CID = "ipfs://QmPgvwkpDNgHSTx3V7NrLwCrQbppN39Zpji6o3TwbtVuiU";
  const EXPECTED_DOC_HASH = ethers.keccak256(ethers.toUtf8Bytes(DELIVERABLE_CID));
  const INVOICE_REF = ethers.keccak256(ethers.toUtf8Bytes("INV-2026-001"));

  beforeEach(async function () {
    [owner, proposer, payeeVendor, attackerTarget, reviewer] = await ethers.getSigners();

    // Deploy Mock Tokens
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

    // Set governor on treasury
    await treasury.setGovernor(await governor.getAddress());

    // Fund Treasury
    await mockUSDC.mint(owner.address, DEPOSIT_AMOUNT);
    await mockUSDC.approve(await treasury.getAddress(), DEPOSIT_AMOUNT);
    await treasury.depositUSDC(DEPOSIT_AMOUNT);
  });

  describe("1. Document-Anchored Entries (Odoo vs ERPNext Architecture)", function () {
    it("should require an explicit document reference (Order & Receipt) on-chain for release", async function () {
      const proposalId = 1n;
      const milestoneId = 1n;
      const milestoneAmount = 40n * 10n ** 6n; // 40 USDC (below 50 USDC human threshold)

      // Register Order on Treasury
      await treasury.registerOrder(
        proposalId,
        milestoneId,
        payeeVendor.address,
        milestoneAmount,
        EXPECTED_DOC_HASH,
        DELIVERABLE_CID
      );

      // Verify order exists on-chain
      const orderKey = ethers.keccak256(
        ethers.solidityPacked(["uint256", "uint256"], [proposalId, milestoneId])
      );
      const order = await treasury.registeredOrders(orderKey);
      expect(order.exists).to.be.true;
      expect(order.recipient).to.equal(payeeVendor.address);
      expect(order.amount).to.equal(milestoneAmount);
      expect(order.expectedDocumentHash).to.equal(EXPECTED_DOC_HASH);

      // Execute Three-Way Match release
      await expect(
        treasury.releaseMilestone(
          proposalId,
          milestoneId,
          EXPECTED_DOC_HASH,
          INVOICE_REF,
          payeeVendor.address,
          milestoneAmount,
          95 // AI confidence score
        )
      )
        .to.emit(treasury, "ThreeWayMatchSuccess")
        .withArgs(
          ethers.keccak256(ethers.solidityPacked(["uint256", "uint256", "bytes32"], [proposalId, milestoneId, INVOICE_REF])),
          proposalId,
          milestoneId,
          EXPECTED_DOC_HASH,
          INVOICE_REF,
          payeeVendor.address,
          milestoneAmount
        );

      // Verify the on-chain ReleaseEntry links payment directly to the document
      const releaseKey = ethers.keccak256(ethers.solidityPacked(["uint256", "uint256", "bytes32"], [proposalId, milestoneId, INVOICE_REF]));
      const entry = await treasury.getReleaseEntry(releaseKey);
      expect(entry.proposalId).to.equal(proposalId);
      expect(entry.milestoneId).to.equal(milestoneId);
      expect(entry.documentHash).to.equal(EXPECTED_DOC_HASH);
      expect(entry.invoiceHash).to.equal(INVOICE_REF);
      expect(entry.recipient).to.equal(payeeVendor.address);
      expect(entry.amount).to.equal(milestoneAmount);
      expect(entry.executed).to.be.true;
    });

    it("should revert if order terms do not exist (cannot release from a bare running ledger)", async function () {
      const nonExistentProposalId = 999n;
      const milestoneId = 1n;
      const amount = 20n * 10n ** 6n;

      await expect(
        treasury.releaseMilestone(
          nonExistentProposalId,
          milestoneId,
          EXPECTED_DOC_HASH,
          INVOICE_REF,
          payeeVendor.address,
          amount,
          90
        )
      ).to.be.revertedWithCustomError(treasury, "OrderNotFound");
    });
  });

  describe("2. Contract-Level Three-Way Match & Loud Reverts (No Silent Round Off)", function () {
    const proposalId = 2n;
    const milestoneId = 1n;
    const milestoneAmount = 30n * 10n ** 6n; // 30 USDC

    beforeEach(async function () {
      await treasury.registerOrder(
        proposalId,
        milestoneId,
        payeeVendor.address,
        milestoneAmount,
        EXPECTED_DOC_HASH,
        DELIVERABLE_CID
      );
    });

    it("should revert loudly with DocumentReceiptMismatch if deliverable document hash differs", async function () {
      const forgedDocHash = ethers.keccak256(ethers.toUtf8Bytes("ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"));

      await expect(
        treasury.releaseMilestone(
          proposalId,
          milestoneId,
          forgedDocHash, // Mismatched receipt
          INVOICE_REF,
          payeeVendor.address,
          milestoneAmount,
          95
        )
      )
        .to.be.revertedWithCustomError(treasury, "DocumentReceiptMismatch")
        .withArgs(EXPECTED_DOC_HASH, forgedDocHash);
    });

    it("should revert loudly with AmountMismatch if release amount differs even by 1 micro-USDC (no ERPNext-style round off)", async function () {
      // Trying to release 30.000001 USDC instead of 30.000000 USDC
      const slightImbalance = milestoneAmount + 1n;

      await expect(
        treasury.releaseMilestone(
          proposalId,
          milestoneId,
          EXPECTED_DOC_HASH,
          INVOICE_REF,
          payeeVendor.address,
          slightImbalance,
          95
        )
      )
        .to.be.revertedWithCustomError(treasury, "AmountMismatch")
        .withArgs(milestoneAmount, slightImbalance);
    });

    it("should revert loudly with PayeeMismatch if invoice payee differs from order recipient", async function () {
      await expect(
        treasury.releaseMilestone(
          proposalId,
          milestoneId,
          EXPECTED_DOC_HASH,
          INVOICE_REF,
          attackerTarget.address, // Payee mismatch
          milestoneAmount,
          95
        )
      )
        .to.be.revertedWithCustomError(treasury, "PayeeMismatch")
        .withArgs(payeeVendor.address, attackerTarget.address);
    });
  });

  describe("3. Payee Substitution Defense: Change Tracking & Cooldown", function () {
    const proposalId = 3n;
    const milestoneId = 1n;
    const milestoneAmount = 25n * 10n ** 6n;

    beforeEach(async function () {
      await treasury.registerOrder(
        proposalId,
        milestoneId,
        payeeVendor.address,
        milestoneAmount,
        EXPECTED_DOC_HASH,
        DELIVERABLE_CID
      );
    });

    it("should log PayeeChangeRequested and enforce a cooldown when payout target changes", async function () {
      // Vendor requests to change payout bank/wallet details to attackerTarget (or new address)
      const tx = await treasury.connect(payeeVendor).requestPayeeChange(proposalId, attackerTarget.address);
      const receipt = await tx.wait();

      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      const expectedExpiry = BigInt(block!.timestamp) + 172800n; // 2 days cooldown

      await expect(tx)
        .to.emit(treasury, "PayeeChangeRequested")
        .withArgs(proposalId, payeeVendor.address, attackerTarget.address, expectedExpiry);

      // Attempting immediate release to the new target during cooldown MUST revert!
      await expect(
        treasury.releaseMilestone(
          proposalId,
          milestoneId,
          EXPECTED_DOC_HASH,
          INVOICE_REF,
          attackerTarget.address,
          milestoneAmount,
          95
        )
      ).to.be.revertedWithCustomError(treasury, "PayeeCooldownActive");

      // Fast-forward time past the 48-hour cooldown
      await ethers.provider.send("evm_increaseTime", [172801]);
      await ethers.provider.send("evm_mine", []);

      // Confirm payee change
      await expect(treasury.confirmPayeeChange(proposalId))
        .to.emit(treasury, "PayeeChangeConfirmed")
        .withArgs(proposalId, payeeVendor.address, attackerTarget.address);

      // Now release to new target succeeds!
      await expect(
        treasury.releaseMilestone(
          proposalId,
          milestoneId,
          EXPECTED_DOC_HASH,
          INVOICE_REF,
          attackerTarget.address,
          milestoneAmount,
          95
        )
      ).to.emit(treasury, "ThreeWayMatchSuccess");

      expect(await mockUSDC.balanceOf(attackerTarget.address)).to.equal(milestoneAmount);
    });

    it("should allow governor or owner to immediately override payee in emergencies", async function () {
      await expect(treasury.overridePayeeChange(proposalId, attackerTarget.address))
        .to.emit(treasury, "PayeeChangeConfirmed")
        .withArgs(proposalId, payeeVendor.address, attackerTarget.address);

      // Immediate release to new target works with governor override
      await expect(
        treasury.releaseMilestone(
          proposalId,
          milestoneId,
          EXPECTED_DOC_HASH,
          INVOICE_REF,
          attackerTarget.address,
          milestoneAmount,
          95
        )
      ).to.emit(treasury, "ThreeWayMatchSuccess");
    });
  });

  describe("4. Model Verdict as Input, Never Release Trigger (Multisig/Human Threshold)", function () {
    const proposalId = 4n;
    const milestoneId = 1n;
    const largeAmount = 200n * 10n ** 6n; // 200 USDC > 50 USDC human review threshold

    beforeEach(async function () {
      await treasury.registerOrder(
        proposalId,
        milestoneId,
        payeeVendor.address,
        largeAmount,
        EXPECTED_DOC_HASH,
        DELIVERABLE_CID
      );
    });

    it("should revert if model confidence score is below threshold", async function () {
      await expect(
        treasury.releaseMilestone(
          proposalId,
          milestoneId,
          EXPECTED_DOC_HASH,
          INVOICE_REF,
          payeeVendor.address,
          largeAmount,
          65 // 65 < 80 minimum confidence
        )
      )
        .to.be.revertedWithCustomError(treasury, "LowConfidenceScore")
        .withArgs(65, 80);
    });

    it("should require human/multisig signoff above threshold even if model gives 100% confidence", async function () {
      const releaseKey = ethers.keccak256(
        ethers.solidityPacked(["uint256", "uint256", "bytes32"], [proposalId, milestoneId, INVOICE_REF])
      );

      // Model says 100% valid! But amount is 200 USDC (> 50 USDC threshold).
      // Attempting to release directly by non-governor/owner MUST revert!
      await expect(
        treasury.connect(proposer).releaseMilestone(
          proposalId,
          milestoneId,
          EXPECTED_DOC_HASH,
          INVOICE_REF,
          payeeVendor.address,
          largeAmount,
          100 // 100% confidence!
        )
      )
        .to.be.revertedWithCustomError(treasury, "HumanApprovalRequired")
        .withArgs(releaseKey, largeAmount, 50n * 10n ** 6n);

      // Reviewer/Governor approves the release
      await expect(treasury.approveReleaseHuman(releaseKey))
        .to.emit(treasury, "HumanApprovalGranted")
        .withArgs(releaseKey, owner.address);

      // Now release succeeds with human signoff!
      await expect(
        treasury.connect(proposer).releaseMilestone(
          proposalId,
          milestoneId,
          EXPECTED_DOC_HASH,
          INVOICE_REF,
          payeeVendor.address,
          largeAmount,
          100
        )
      ).to.emit(treasury, "ThreeWayMatchSuccess");

      expect(await mockUSDC.balanceOf(payeeVendor.address)).to.equal(largeAmount);
    });
  });

  describe("5. Idempotency Guard & Dry-Run Simulation (Ghostfolio Pattern)", function () {
    const proposalId = 5n;
    const milestoneId = 1n;
    const milestoneAmount = 35n * 10n ** 6n; // 35 USDC

    beforeEach(async function () {
      await treasury.registerOrder(
        proposalId,
        milestoneId,
        payeeVendor.address,
        milestoneAmount,
        EXPECTED_DOC_HASH,
        DELIVERABLE_CID
      );
    });

    it("should accurately preview release in dry-run mode before committing transaction", async function () {
      // 1. Dry run on valid release
      const validSim = await treasury.simulateRelease(
        proposalId,
        milestoneId,
        EXPECTED_DOC_HASH,
        INVOICE_REF,
        payeeVendor.address,
        milestoneAmount,
        95
      );
      expect(validSim.canRelease).to.be.true;
      expect(validSim.isDuplicate).to.be.false;
      expect(validSim.orderMatches).to.be.true;
      expect(validSim.receiptMatches).to.be.true;
      expect(validSim.invoiceMatches).to.be.true;
      expect(validSim.payeeMatches).to.be.true;
      expect(validSim.returnCode).to.equal(200n);
      expect(validSim.statusMessage).to.equal("READY_FOR_RELEASE");

      // 2. Dry run with document hash mismatch
      const wrongDocSim = await treasury.simulateRelease(
        proposalId,
        milestoneId,
        ethers.keccak256(ethers.toUtf8Bytes("wrong-doc")),
        INVOICE_REF,
        payeeVendor.address,
        milestoneAmount,
        95
      );
      expect(wrongDocSim.canRelease).to.be.false;
      expect(wrongDocSim.receiptMatches).to.be.false;
      expect(wrongDocSim.returnCode).to.equal(422n);
      expect(wrongDocSim.statusMessage).to.equal("RECEIPT_DOCUMENT_HASH_MISMATCH");

      // 3. Dry run with amount mismatch
      const wrongAmtSim = await treasury.simulateRelease(
        proposalId,
        milestoneId,
        EXPECTED_DOC_HASH,
        INVOICE_REF,
        payeeVendor.address,
        milestoneAmount + 10n,
        95
      );
      expect(wrongAmtSim.canRelease).to.be.false;
      expect(wrongAmtSim.returnCode).to.equal(400n);
      expect(wrongAmtSim.statusMessage).to.equal("AMOUNT_MISMATCH");
    });

    it("should prevent duplicate release replay attacks via idempotency guard", async function () {
      // First release executes cleanly
      await treasury.releaseMilestone(
        proposalId,
        milestoneId,
        EXPECTED_DOC_HASH,
        INVOICE_REF,
        payeeVendor.address,
        milestoneAmount,
        95
      );

      // Dry run now signals duplicate! (Ghostfolio duplicate signal per row)
      const duplicateSim = await treasury.simulateRelease(
        proposalId,
        milestoneId,
        EXPECTED_DOC_HASH,
        INVOICE_REF,
        payeeVendor.address,
        milestoneAmount,
        95
      );
      expect(duplicateSim.canRelease).to.be.false;
      expect(duplicateSim.isDuplicate).to.be.true;
      expect(duplicateSim.returnCode).to.equal(409n);
      expect(duplicateSim.statusMessage).to.equal("DUPLICATE_RELEASE");

      // Replaying the release transaction reverts loudly
      const releaseKey = ethers.keccak256(
        ethers.solidityPacked(["uint256", "uint256", "bytes32"], [proposalId, milestoneId, INVOICE_REF])
      );
      await expect(
        treasury.releaseMilestone(
          proposalId,
          milestoneId,
          EXPECTED_DOC_HASH,
          INVOICE_REF,
          payeeVendor.address,
          milestoneAmount,
          95
        )
      )
        .to.be.revertedWithCustomError(treasury, "DuplicateRelease")
        .withArgs(releaseKey);
    });
  });

  describe("6. Escrow Release Valve: Agent On-Chain Cap & Human Review Gate (Arc Mainnet)", function () {
    const proposalId = 6n;
    const milestoneId = 1n;
    const capAmount = 50n * 10n ** 6n; // 50 USDC cap
    const overCapAmount = 150n * 10n ** 6n; // 150 USDC (> cap)

    let autonomousAgent: any;
    let complianceReviewer: any;

    beforeEach(async function () {
      [, , , autonomousAgent, complianceReviewer] = await ethers.getSigners();

      // Configure agent and reviewer on Treasury
      await treasury.setAgentAddress(autonomousAgent.address);
      await treasury.setAuthorizedHumanReviewer(complianceReviewer.address, true);

      // Register an order with over-cap amount
      await treasury.registerOrder(
        proposalId,
        milestoneId,
        payeeVendor.address,
        overCapAmount,
        EXPECTED_DOC_HASH,
        DELIVERABLE_CID
      );
    });

    it("should report the active on-chain agent release cap (50 USDC default)", async function () {
      expect(await treasury.agentReleaseCap()).to.equal(50n * 10n ** 6n);
      expect(await treasury.humanReviewThreshold()).to.equal(50n * 10n ** 6n);
      expect(await treasury.isAuthorizedAgent(autonomousAgent.address)).to.be.true;
      expect(await treasury.isAuthorizedReviewer(complianceReviewer.address)).to.be.true;
    });

    it("should allow owner to update agent release cap with loud event emission", async function () {
      const newCap = 100n * 10n ** 6n;
      await expect(treasury.setAgentReleaseCap(newCap))
        .to.emit(treasury, "AgentReleaseCapUpdated")
        .withArgs(capAmount, newCap);
      expect(await treasury.agentReleaseCap()).to.equal(newCap);

      // Reset cap
      await treasury.setAgentReleaseCap(capAmount);
    });

    it("should stop autonomous agent at the on-chain cap and require human approval", async function () {
      const releaseKey = ethers.keccak256(
        ethers.solidityPacked(["uint256", "uint256", "bytes32"], [proposalId, milestoneId, INVOICE_REF])
      );

      // Check permission pre-flight: agent is stopped at cap
      const authPre = await treasury.getReleaseAuthorization(autonomousAgent.address, overCapAmount, releaseKey);
      expect(authPre.canReleaseDirectly).to.be.false;
      expect(authPre.requiresHumanApproval).to.be.true;
      expect(authPre.releaseRole).to.equal("AGENT_STOPPED_AT_CAP");

      // Agent attempts release over cap: reverts loudly
      await expect(
        treasury.connect(autonomousAgent).releaseMilestone(
          proposalId,
          milestoneId,
          EXPECTED_DOC_HASH,
          INVOICE_REF,
          payeeVendor.address,
          overCapAmount,
          95
        )
      )
        .to.be.revertedWithCustomError(treasury, "HumanApprovalRequired")
        .withArgs(releaseKey, overCapAmount, capAmount);

      // Designated compliance reviewer grants human approval
      await expect(treasury.connect(complianceReviewer).approveReleaseHuman(releaseKey))
        .to.emit(treasury, "HumanApprovalGranted")
        .withArgs(releaseKey, complianceReviewer.address);

      // Post-approval: authorization is now cleared
      const authPost = await treasury.getReleaseAuthorization(autonomousAgent.address, overCapAmount, releaseKey);
      expect(authPost.canReleaseDirectly).to.be.true;
      expect(authPost.requiresHumanApproval).to.be.false;

      // Agent can now release funds cleanly!
      await expect(
        treasury.connect(autonomousAgent).releaseMilestone(
          proposalId,
          milestoneId,
          EXPECTED_DOC_HASH,
          INVOICE_REF,
          payeeVendor.address,
          overCapAmount,
          95
        )
      ).to.emit(treasury, "ThreeWayMatchSuccess");

      // Exact disbursement delivered to payee
      expect(await mockUSDC.balanceOf(payeeVendor.address)).to.equal(overCapAmount);

      // Same payment cannot run twice
      await expect(
        treasury.connect(autonomousAgent).releaseMilestone(
          proposalId,
          milestoneId,
          EXPECTED_DOC_HASH,
          INVOICE_REF,
          payeeVendor.address,
          overCapAmount,
          95
        )
      )
        .to.be.revertedWithCustomError(treasury, "DuplicateRelease")
        .withArgs(releaseKey);
    });

    it("should allow autonomous agent to release directly when under cap with valid proof", async function () {
      const underCapPropId = 7n;
      const underCapAmount = 45n * 10n ** 6n; // 45 USDC <= 50 USDC cap

      await treasury.registerOrder(
        underCapPropId,
        milestoneId,
        payeeVendor.address,
        underCapAmount,
        EXPECTED_DOC_HASH,
        DELIVERABLE_CID
      );

      const releaseKey = ethers.keccak256(
        ethers.solidityPacked(["uint256", "uint256", "bytes32"], [underCapPropId, milestoneId, INVOICE_REF])
      );

      // Check pre-flight authorization
      const auth = await treasury.getReleaseAuthorization(autonomousAgent.address, underCapAmount, releaseKey);
      expect(auth.canReleaseDirectly).to.be.true;
      expect(auth.requiresHumanApproval).to.be.false;
      expect(auth.releaseRole).to.equal("AUTONOMOUS_AGENT");

      // Direct release under cap by autonomous agent succeeds without stopping for human
      await expect(
        treasury.connect(autonomousAgent).releaseMilestone(
          underCapPropId,
          milestoneId,
          EXPECTED_DOC_HASH,
          INVOICE_REF,
          payeeVendor.address,
          underCapAmount,
          90
        )
      ).to.emit(treasury, "ThreeWayMatchSuccess");

      // Attempting to run same payment twice reverts
      await expect(
        treasury.connect(autonomousAgent).releaseMilestone(
          underCapPropId,
          milestoneId,
          EXPECTED_DOC_HASH,
          INVOICE_REF,
          payeeVendor.address,
          underCapAmount,
          90
        )
      ).to.be.revertedWithCustomError(treasury, "DuplicateRelease");
    });
  });
});
