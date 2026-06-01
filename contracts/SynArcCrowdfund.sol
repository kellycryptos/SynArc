// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SynArcCrowdfund is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Milestone {
        string title;
        uint256 amount;
        bool approved;
        bool claimed;
        string description;
    }

    address public creator;
    address public recipient;
    address public usdcToken;
    uint256 public goal;
    uint256 public deadline;
    bool public isAgent;
    string public title;
    string public description;
    string public category;
    
    uint256 public totalRaised;
    uint256 public totalContributors;
    mapping(address => uint256) public contributions;
    
    Milestone[] public milestones;

    event Contributed(address indexed contributor, uint256 amount);
    event MilestoneApproved(uint256 indexed milestoneIndex);
    event FundsWithdrawn(address indexed recipient, uint256 amount);
    event RefundClaimed(address indexed contributor, uint256 amount);

    constructor(
        address _creator,
        address _recipient,
        address _usdcToken,
        uint256 _goal,
        uint256 _durationDays,
        bool _isAgent,
        string memory _title,
        string memory _description,
        string memory _category,
        string[] memory milestoneTitles,
        uint256[] memory milestoneAmounts,
        string[] memory milestoneDescriptions
    ) {
        require(milestoneTitles.length == milestoneAmounts.length && milestoneAmounts.length == milestoneDescriptions.length, "Mismatched milestones");
        require(_goal > 0, "Goal must be > 0");
        
        creator = _creator;
        recipient = _recipient;
        usdcToken = _usdcToken;
        goal = _goal;
        deadline = block.timestamp + (_durationDays * 1 days);
        isAgent = _isAgent;
        title = _title;
        description = _description;
        category = _category;

        uint256 totalMilestoneAmount = 0;
        for (uint256 i = 0; i < milestoneTitles.length; i++) {
            milestones.push(Milestone({
                title: milestoneTitles[i],
                amount: milestoneAmounts[i],
                approved: false,
                claimed: false,
                description: milestoneDescriptions[i]
            }));
            totalMilestoneAmount += milestoneAmounts[i];
        }
        require(totalMilestoneAmount == _goal, "Milestone budgets must equal goal");
    }

    function contribute(uint256 amount) external nonReentrant {
        require(block.timestamp <= deadline, "Campaign has ended");
        require(amount > 0, "Contribution must be > 0");

        IERC20(usdcToken).safeTransferFrom(msg.sender, address(this), amount);
        
        if (contributions[msg.sender] == 0) {
            totalContributors++;
        }
        contributions[msg.sender] += amount;
        totalRaised += amount;

        emit Contributed(msg.sender, amount);
    }

    function approveMilestone(uint256 index) external {
        require(index < milestones.length, "Invalid milestone index");
        require(!milestones[index].approved, "Milestone already approved");
        require(msg.sender == creator || msg.sender == tx.origin, "Unauthorized");

        milestones[index].approved = true;
        emit MilestoneApproved(index);
    }

    function withdrawMilestone(uint256 index) external nonReentrant {
        require(msg.sender == recipient || msg.sender == creator, "Only recipient can withdraw");
        require(index < milestones.length, "Invalid milestone index");
        require(milestones[index].approved, "Milestone not approved yet");
        require(!milestones[index].claimed, "Milestone already claimed");
        require(totalRaised >= goal, "Goal not reached");

        milestones[index].claimed = true;
        uint256 amount = milestones[index].amount;
        IERC20(usdcToken).safeTransfer(recipient, amount);

        emit FundsWithdrawn(recipient, amount);
    }

    function claimRefund() external nonReentrant {
        require(block.timestamp > deadline, "Campaign has not ended yet");
        require(totalRaised < goal, "Goal was reached, no refunds");
        
        uint256 amount = contributions[msg.sender];
        require(amount > 0, "No contribution to refund");
        
        contributions[msg.sender] = 0;
        IERC20(usdcToken).safeTransfer(msg.sender, amount);
        
        emit RefundClaimed(msg.sender, amount);
    }

    function getMilestones() external view returns (Milestone[] memory) {
        return milestones;
    }
}
