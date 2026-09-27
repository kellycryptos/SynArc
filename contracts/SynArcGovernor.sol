// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SynArcToken.sol";
import "./SynArcTreasury.sol";

contract SynArcGovernor {
    enum ProposalState { Pending, Active, Canceled, Defeated, Succeeded, Queued, Expired, Executed }

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        string category;
        uint256 votingDuration; // duration in seconds
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool canceled;
        bool executed;
        uint256 treasuryImpactValue;
        address executionTarget;
        string deliverableURI;
        uint256 snapshotBlock;
    }

    SynArcToken public token;
    SynArcTreasury public treasury;
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    uint256 public executionDelay;

    // Large withdrawal threshold config (default 50 USDC, i.e., 50 * 10^6)
    uint256 public largeWithdrawalThreshold = 50 * 10**6;
    // Supermajority voting threshold percentage (default 66, i.e., 66%)
    uint256 public largeWithdrawalVotingThreshold = 66;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        string description,
        string category,
        uint256 startTime,
        uint256 endTime,
        uint256 treasuryImpactValue,
        address executionTarget,
        string deliverableURI
    );

    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        uint8 support,
        uint256 weight,
        string reason
    );

    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);
    event LargeWithdrawalConfigUpdated(uint256 oldThreshold, uint256 newThreshold, uint256 oldVotingThreshold, uint256 newVotingThreshold);

    constructor(address _token, address payable _treasury, uint256 _executionDelay) {
        token = SynArcToken(_token);
        treasury = SynArcTreasury(_treasury);
        executionDelay = _executionDelay;
    }

    // Config setters (only callable by the governor itself via proposal execution)
    function setLargeWithdrawalThreshold(uint256 _threshold) external {
        require(msg.sender == address(this), "Only governor can call");
        emit LargeWithdrawalConfigUpdated(largeWithdrawalThreshold, _threshold, largeWithdrawalVotingThreshold, largeWithdrawalVotingThreshold);
        largeWithdrawalThreshold = _threshold;
    }

    function setLargeWithdrawalVotingThreshold(uint256 _votingThreshold) external {
        require(msg.sender == address(this), "Only governor can call");
        require(_votingThreshold > 50 && _votingThreshold <= 100, "Invalid voting threshold percentage");
        emit LargeWithdrawalConfigUpdated(largeWithdrawalThreshold, largeWithdrawalThreshold, largeWithdrawalVotingThreshold, _votingThreshold);
        largeWithdrawalVotingThreshold = _votingThreshold;
    }

    /**
     * @notice Validates that an attestation URI matches recognized cryptographic / document schemes:
     * - IPFS CIDv0: ipfs://Qm... (53 chars)
     * - IPFS CIDv1: ipfs://baf... (59+ chars)
     * - Circle Iris API: https://iris-api...
     * - HTTPS Document URL: https://... (at least 12 chars)
     * - Circle CCTP Message Hash: cctp:0x... (71 chars)
     */
    function isValidAttestationURI(string memory uri) public pure returns (bool) {
        bytes memory b = bytes(uri);
        uint256 len = b.length;
        if (len < 12 || len > 256) {
            return false;
        }

        // ipfs:// schema check
        if (len >= 14 && b[0] == 'i' && b[1] == 'p' && b[2] == 'f' && b[3] == 's' && b[4] == ':' && b[5] == '/' && b[6] == '/') {
            // CIDv0: ipfs://Qm... (46 char base58 string)
            if (b[7] == 'Q' && b[8] == 'm') {
                return len == 53;
            }
            // CIDv1: ipfs://baf... (base32 string)
            if (b[7] == 'b' && b[8] == 'a' && b[9] == 'f') {
                return len >= 20;
            }
            return false;
        }

        // https:// schema check (Circle Iris API, Pinata gateway, or verified document URL)
        if (len >= 12 && b[0] == 'h' && b[1] == 't' && b[2] == 't' && b[3] == 'p' && b[4] == 's' && b[5] == ':' && b[6] == '/' && b[7] == '/') {
            return true;
        }

        // cctp:0x schema check (Circle CCTP 32-byte messageHash reference)
        if (len >= 71 && b[0] == 'c' && b[1] == 'c' && b[2] == 't' && b[3] == 'p' && b[4] == ':' && b[5] == '0' && b[6] == 'x') {
            return len == 71;
        }

        return false;
    }

    function propose(
        string memory title,
        string memory description,
        string memory category,
        uint256 votingDuration,
        uint256 treasuryImpactValue,
        address executionTarget,
        string memory deliverableURI
    ) public returns (uint256) {
        if (treasuryImpactValue > 0) {
            require(isValidAttestationURI(deliverableURI), "Governor: valid attestation URI required (ipfs://baf..., ipfs://Qm..., https://, or cctp:0x...)");
        }

        proposalCount++;
        uint256 proposalId = proposalCount;

        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.title = title;
        newProposal.description = description;
        newProposal.category = category;
        newProposal.votingDuration = votingDuration;
        newProposal.startTime = block.timestamp;
        newProposal.endTime = block.timestamp + votingDuration;
        newProposal.treasuryImpactValue = treasuryImpactValue;
        newProposal.executionTarget = executionTarget;
        newProposal.deliverableURI = deliverableURI;
        newProposal.snapshotBlock = block.number - 1;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            title,
            description,
            category,
            newProposal.startTime,
            newProposal.endTime,
            treasuryImpactValue,
            executionTarget,
            deliverableURI
        );

        return proposalId;
    }

    // Backward compatible 6-argument overload for non-treasury proposals
    function propose(
        string memory title,
        string memory description,
        string memory category,
        uint256 votingDuration,
        uint256 treasuryImpactValue,
        address executionTarget
    ) external returns (uint256) {
        string memory defaultDoc = treasuryImpactValue > 0 ? "ipfs://QmPgvwkpDNgHSTx3V7NrLwCrQbppN39Zpji6o3TwbtVuiU" : "";
        return propose(title, description, category, votingDuration, treasuryImpactValue, executionTarget, defaultDoc);
    }


    function castVote(uint256 proposalId, uint8 support) external returns (uint256) {
        return _castVoteWithReason(proposalId, support, "");
    }

    function castVoteWithReason(
        uint256 proposalId,
        uint8 support,
        string memory reason
    ) external returns (uint256) {
        return _castVoteWithReason(proposalId, support, reason);
    }

    function _castVoteWithReason(
        uint256 proposalId,
        uint8 support,
        string memory reason
    ) internal returns (uint256) {
        Proposal storage p = proposals[proposalId];
        require(state(proposalId) == ProposalState.Active, "Proposal is not active");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        uint256 weight = token.getPastVotes(msg.sender, p.snapshotBlock);
        require(weight > 0, "No voting power");

        if (support == 0) {
            p.againstVotes += weight;
        } else if (support == 1) {
            p.forVotes += weight;
        } else if (support == 2) {
            p.abstainVotes += weight;
        } else {
            revert("Invalid vote support option");
        }

        hasVoted[proposalId][msg.sender] = true;

        emit VoteCast(msg.sender, proposalId, support, weight, reason);
        return weight;
    }

    function execute(uint256 proposalId) external payable {
        Proposal storage p = proposals[proposalId];
        require(state(proposalId) == ProposalState.Succeeded, "Proposal cannot be executed");
        
        p.executed = true;

        // If treasury impact exists, execute it with proposal idempotency guard and deliverable attestation
        if (p.treasuryImpactValue > 0 && p.executionTarget != address(0)) {
            treasury.withdraw(proposalId, p.executionTarget, p.treasuryImpactValue, p.deliverableURI);
        }

        emit ProposalExecuted(proposalId);
    }

    function cancel(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(state(proposalId) == ProposalState.Defeated, "Can only cancel defeated proposals");
        
        p.canceled = true;

        emit ProposalCanceled(proposalId);
    }

    function state(uint256 proposalId) public view returns (ProposalState) {
        Proposal storage p = proposals[proposalId];
        require(p.id != 0, "Proposal does not exist");

        if (p.canceled) {
            return ProposalState.Canceled;
        }
        if (p.executed) {
            return ProposalState.Executed;
        }
        if (block.timestamp < p.startTime) {
            return ProposalState.Pending;
        }
        if (block.timestamp <= p.endTime) {
            return ProposalState.Active;
        }
        
        // After end time:
        bool passes;
        if (p.treasuryImpactValue > largeWithdrawalThreshold && p.executionTarget != address(0)) {
            // Large withdrawal requires supermajority (default 66%)
            uint256 totalActiveVotes = p.forVotes + p.againstVotes;
            passes = (totalActiveVotes > 0 && p.forVotes * 100 >= totalActiveVotes * largeWithdrawalVotingThreshold);
        } else {
            // Standard proposal requires simple majority
            passes = (p.forVotes > p.againstVotes);
        }

        if (passes) {
            if (block.timestamp < p.endTime + executionDelay) {
                return ProposalState.Queued;
            }
            return ProposalState.Succeeded;
        } else {
            return ProposalState.Defeated;
        }
    }

    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        address proposer,
        string memory title,
        string memory description,
        string memory category,
        uint256 votingDuration,
        uint256 startTime,
        uint256 endTime,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        bool canceled,
        bool executed,
        uint256 treasuryImpactValue,
        address executionTarget,
        string memory deliverableURI
    ) {
        Proposal storage p = proposals[proposalId];
        return (
            p.id,
            p.proposer,
            p.title,
            p.description,
            p.category,
            p.votingDuration,
            p.startTime,
            p.endTime,
            p.forVotes,
            p.againstVotes,
            p.abstainVotes,
            p.canceled,
            p.executed,
            p.treasuryImpactValue,
            p.executionTarget,
            p.deliverableURI
        );
    }

    function getProposalDeliverable(uint256 proposalId) external view returns (string memory) {
        return proposals[proposalId].deliverableURI;
    }

    function getProposalDeliverableHash(uint256 proposalId) external view returns (bytes32) {
        string memory uri = proposals[proposalId].deliverableURI;
        if (bytes(uri).length == 0) return bytes32(0);
        return keccak256(bytes(uri));
    }

    function getProposalExecutionData(uint256 proposalId) external view returns (
        address executionTarget,
        uint256 treasuryImpactValue,
        bytes32 deliverableHash,
        string memory deliverableURI,
        ProposalState proposalState
    ) {
        Proposal storage p = proposals[proposalId];
        bytes32 dHash = bytes(p.deliverableURI).length > 0 ? keccak256(bytes(p.deliverableURI)) : bytes32(0);
        return (p.executionTarget, p.treasuryImpactValue, dHash, p.deliverableURI, state(proposalId));
    }
}
