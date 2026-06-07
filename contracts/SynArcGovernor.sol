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
        uint256 snapshotBlock;
    }

    SynArcToken public token;
    SynArcTreasury public treasury;
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    uint256 public executionDelay;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        string description,
        string category,
        uint256 startTime,
        uint256 endTime,
        uint256 treasuryImpactValue,
        address executionTarget
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

    constructor(address _token, address payable _treasury, uint256 _executionDelay) {
        token = SynArcToken(_token);
        treasury = SynArcTreasury(_treasury);
        executionDelay = _executionDelay;
    }

    function propose(
        string memory title,
        string memory description,
        string memory category,
        uint256 votingDuration,
        uint256 treasuryImpactValue,
        address executionTarget
    ) external returns (uint256) {
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
            executionTarget
        );

        return proposalId;
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

        // If treasury impact exists, execute it
        if (p.treasuryImpactValue > 0 && p.executionTarget != address(0)) {
            treasury.withdraw(p.executionTarget, p.treasuryImpactValue);
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
        if (p.forVotes > p.againstVotes) {
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
        address executionTarget
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
            p.executionTarget
        );
    }
}
