import { expect } from "chai";
import { ForensicAuditor, ReleaseIntent } from "../lib/agent/forensic-auditor";

describe("Forensic Sentinel Agent: Adversarial Audit & Canteen Defense Matrix", function () {
  const VALID_CIDV0 = "ipfs://QmPgvwkpDNgHSTx3V7NrLwCrQbppN39Zpji6o3TwbtVuiU";
  const FAKE_PLACEHOLDER_CID = "ipfs://bafkreiautonomousagentfakeplaceholderreceipt";
  const VENDOR_PAYEE = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
  const ATTACKER_PAYEE = "0xDead00000000000000000000000000000000BEEF";

  describe("1. Document Schema & Cryptographic Format Validation", function () {
    it("should accept valid 53-character CIDv0 hashes", function () {
      const res = ForensicAuditor.validateAttestationSchema(VALID_CIDV0);
      expect(res.valid).to.be.true;
      expect(res.reason).to.include("Valid IPFS CIDv0");
    });

    it("should reject invalid length CIDv0 hashes", function () {
      const res = ForensicAuditor.validateAttestationSchema("ipfs://QmShortHash");
      expect(res.valid).to.be.false;
      expect(res.reason).to.include("must be exactly 53 characters");
    });

    it("should reject fabricated human-readable CIDv1 placeholders", function () {
      const res = ForensicAuditor.validateAttestationSchema(FAKE_PLACEHOLDER_CID);
      expect(res.valid).to.be.false;
      expect(res.reason).to.include("fabricated human-readable placeholder");
    });

    it("should accept valid Circle Iris API URLs", function () {
      const irisProd = "https://iris-api.circle.com/v1/attestations/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const irisSandbox = "https://iris-api-sandbox.circle.com/v1/attestations/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      expect(ForensicAuditor.validateAttestationSchema(irisProd).valid).to.be.true;
      expect(ForensicAuditor.validateAttestationSchema(irisSandbox).valid).to.be.true;
    });

    it("should reject arbitrary non-cryptographic strings", function () {
      const res = ForensicAuditor.validateAttestationSchema("not-a-valid-uri");
      expect(res.valid).to.be.false;
    });
  });

  describe("2. Clean Release Intent Verification", function () {
    it("should issue a PASS verdict with 0 risk score for compliant releases under the 50 USDC cap", async function () {
      const intent: ReleaseIntent = {
        proposalId: "1",
        milestoneId: "1",
        targetPayee: VENDOR_PAYEE,
        amountUSDC: 35.0,
        deliverableURI: VALID_CIDV0
      };

      const ticket = await ForensicAuditor.auditReleaseIntent(intent, {
        recipient: VENDOR_PAYEE,
        amountUSDC: 35.0
      });

      expect(ticket.verdict).to.equal("PASS");
      expect(ticket.riskScore).to.equal(0);
      expect(ticket.canteenControlViolations).to.be.empty;
      expect(ticket.checks.documentIntegrity.passed).to.be.true;
      expect(ticket.checks.payeeIntegrity.passed).to.be.true;
      expect(ticket.checks.zeroRoundoff.passed).to.be.true;
      expect(ticket.checks.releaseValve.passed).to.be.true;
      expect(ticket.ticketSignatureDigest).to.match(/^0x[a-fA-F0-9]{64}$/);
    });
  });

  describe("3. Adversarial Attack Scenarios (Canteen Benchmark)", function () {
    it("Attack 1 (Phantom Invoice): should intercept fake/unpinned CIDs and reject release", async function () {
      const sim = await ForensicAuditor.runSimulatedAttack("phantom_invoice");
      expect(sim.auditTicket.verdict).to.equal("REJECTED_AUDIT_FAILURE");
      expect(sim.auditTicket.riskScore).to.be.at.least(40);
      expect(sim.auditTicket.canteenControlViolations[0]).to.include("Error of Omission");
      expect(sim.synArcOutcome).to.include("PROTECTED");
    });

    it("Attack 2 (Payee Substitution): should catch prompt-injected wallet divergence and alert", async function () {
      const sim = await ForensicAuditor.runSimulatedAttack("payee_substitution");
      expect(sim.auditTicket.verdict).to.equal("REJECTED_AUDIT_FAILURE");
      expect(sim.auditTicket.riskScore).to.be.at.least(50);
      expect(sim.auditTicket.canteenControlViolations[0]).to.include("Payee Substitution");
      expect(sim.sentinelLog).to.include("Payee divergence detected");
    });

    it("Attack 3 (Silent Round-Off): should refuse 1-micro-USDC float drift without rounding", async function () {
      const sim = await ForensicAuditor.runSimulatedAttack("silent_roundoff");
      expect(sim.auditTicket.verdict).to.equal("REJECTED_AUDIT_FAILURE");
      expect(sim.auditTicket.checks.zeroRoundoff.passed).to.be.false;
      expect(sim.auditTicket.canteenControlViolations[0]).to.include("ERPNext Silent Round-Off");
      expect(sim.smartContractRevert).to.include("AmountMismatch");
    });

    it("Attack 4 (Unwitnessed Bridge): should halt cross-chain release lacking Circle Iris attestation", async function () {
      const sim = await ForensicAuditor.runSimulatedAttack("unwitnessed_bridge");
      expect(sim.auditTicket.verdict).to.equal("REJECTED_AUDIT_FAILURE");
      expect(sim.auditTicket.checks.crossChainWitness?.passed).to.be.false;
      expect(sim.auditTicket.canteenControlViolations[0]).to.include("Unwitnessed Cross-Chain");
    });

    it("Attack 5 (Whale Drain Bypass): should hold $500 release at release valve and require human review", async function () {
      const sim = await ForensicAuditor.runSimulatedAttack("whale_drain_bypass");
      expect(sim.auditTicket.verdict).to.equal("FLAGGED_HUMAN_REVIEW");
      expect(sim.auditTicket.checks.releaseValve.passed).to.be.false;
      expect(sim.sentinelLog).to.include("VELOCITY GATE TRIGGERED");
      expect(sim.smartContractRevert).to.include("HumanApprovalRequired");
    });
  });
});
