// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IERC8004Registry {
    function registerAgent(
        address agentAddress,
        string calldata name,
        string calldata description,
        string calldata capabilities,
        string calldata metadataURI
    ) external;
}

interface ISynArcGovernor {
    function propose(
        string calldata title,
        string calldata description,
        string calldata category,
        uint256 votingDuration,
        uint256 treasuryImpactValue,
        address executionTarget
    ) external returns (uint256);
}

interface ISynArcCrowdfund {
    function contribute(uint256 amount) external;
}

/**
 * @title SynArcAgent
 * @dev On-chain Autonomous AI Agent executing governance actions and yield strategies.
 * Integrates natively with the ERC-8004 Trustless Agents Identity Registry.
 */
contract SynArcAgent is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // Official ERC-8004 Identity Registry Address on Arc Testnet
    address public constant ERC8004_REGISTRY = 0x8004A818BFB912233c491871b3d84c89A494BD9e;

    // The authorized hot-wallet script executor address for autonomous triggers
    address public executor;

    // Framework description metadata
    string public frameworkModel;

    // Safety limits: maximum amount per rebalance operation (default 50 USDC)
    uint256 public maxRebalanceAmount = 50 * 10**6;

    struct QueuedAgentWithdrawal {
        uint256 id;
        address token; // address(0) for native ETH/ARC
        address payable recipient;
        uint256 amount;
        uint256 executionTime;
        bool executed;
        bool canceled;
    }

    mapping(uint256 => QueuedAgentWithdrawal) public queuedWithdrawals;
    uint256 public withdrawalCount;
    uint256 public constant WITHDRAWAL_DELAY = 86400; // 24-hour timelock

    event ExecutorUpdated(address indexed oldExecutor, address indexed newExecutor);
    event RegisteredOnERC8004(address indexed registry, string name, string metadataURI);
    event DAOProposalCreated(address indexed governor, uint256 indexed proposalId, string title);
    event CampaignFunded(address indexed campaign, uint256 amount);
    event StrategyExecuted(address indexed targetContract, uint256 amount);
    event MaxRebalanceAmountUpdated(uint256 oldLimit, uint256 newLimit);
    
    event WithdrawalQueued(uint256 indexed id, address indexed token, address indexed recipient, uint256 amount, uint256 executionTime);
    event WithdrawalExecuted(uint256 indexed id, address indexed token, address indexed recipient, uint256 amount);
    event WithdrawalCanceled(uint256 indexed id);

    modifier onlyExecutorOrOwner() {
        require(msg.sender == executor || msg.sender == owner(), "Unauthorized: Caller is not executor or owner");
        _;
    }

    constructor(
        address _owner,
        address _executor,
        string memory _frameworkModel
    ) Ownable(_owner) {
        executor = _executor;
        frameworkModel = _frameworkModel;
        emit ExecutorUpdated(address(0), _executor);
    }

    receive() external payable {}
    fallback() external payable {}

    // Emergency Pause Controls
    function pause() external onlyExecutorOrOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Updates the maximum allowed amount per rebalance operation
     */
    function setMaxRebalanceAmount(uint256 _newLimit) external onlyOwner {
        emit MaxRebalanceAmountUpdated(maxRebalanceAmount, _newLimit);
        maxRebalanceAmount = _newLimit;
    }

    /**
     * @notice Updates the authorized AI agent script address
     * @param _newExecutor The new hot-wallet script execution address
     */
    function setExecutor(address _newExecutor) external onlyOwner {
        require(_newExecutor != address(0), "Invalid executor address");
        address old = executor;
        executor = _newExecutor;
        emit ExecutorUpdated(old, _newExecutor);
    }

    /**
     * @notice Updates the framework model information metadata
     */
    function setFrameworkModel(string calldata _frameworkModel) external onlyOwner {
        frameworkModel = _frameworkModel;
    }

    /**
     * @notice Registers this contract in the ERC-8004 Identity Registry autonomously
     */
    function registerOnRegistry(
        string calldata name,
        string calldata description,
        string calldata capabilities,
        string calldata metadataURI
    ) external onlyExecutorOrOwner whenNotPaused {
        IERC8004Registry(ERC8004_REGISTRY).registerAgent(
            address(this),
            name,
            description,
            capabilities,
            metadataURI
        );
        emit RegisteredOnERC8004(ERC8004_REGISTRY, name, metadataURI);
    }

    /**
     * @notice Submits a governance proposal autonomously on the SynArc Governor contract
     */
    function submitDAOProposal(
        address governor,
        string calldata title,
        string calldata description,
        string calldata category,
        uint256 votingDuration,
        uint256 treasuryImpactValue,
        address executionTarget
    ) external onlyExecutorOrOwner whenNotPaused returns (uint256) {
        // Enforce rebalance limit if it is a funding proposal submitted by the agent
        if (treasuryImpactValue > 0) {
            require(treasuryImpactValue <= maxRebalanceAmount, "Amount exceeds limit per rebalance");
        }

        uint256 propId = ISynArcGovernor(governor).propose(
            title,
            description,
            category,
            votingDuration,
            treasuryImpactValue,
            executionTarget
        );
        emit DAOProposalCreated(governor, propId, title);
        return propId;
    }

    /**
     * @notice Contributes to a crowdfunding campaign on-chain
     */
    function fundCampaign(
        address campaign,
        address usdcToken,
        uint256 amount
    ) external onlyExecutorOrOwner nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        require(amount <= maxRebalanceAmount, "Amount exceeds limit per rebalance");
        
        IERC20(usdcToken).approve(campaign, amount);
        ISynArcCrowdfund(campaign).contribute(amount);
        emit CampaignFunded(campaign, amount);
    }

    /**
     * @notice Sweeps or executes yields into targeted smart contract allocations
     */
    function executeYieldStrategy(
        address targetContract,
        address token,
        uint256 amount,
        bytes calldata data
    ) external onlyExecutorOrOwner nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        require(amount <= maxRebalanceAmount, "Amount exceeds limit per rebalance");
        
        // Approve spending of target contract
        IERC20(token).approve(targetContract, amount);
        
        // Trigger yield operation or pool sweep
        (bool success, ) = targetContract.call(data);
        require(success, "Yield strategy execution failed");
        
        emit StrategyExecuted(targetContract, amount);
    }

    /**
     * @notice Queues a withdrawal subject to a 24-hour timelock (only owner)
     */
    function queueWithdrawal(
        address token,
        address payable recipient,
        uint256 amount
    ) external onlyOwner whenNotPaused {
        require(recipient != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be > 0");
        
        withdrawalCount++;
        queuedWithdrawals[withdrawalCount] = QueuedAgentWithdrawal({
            id: withdrawalCount,
            token: token,
            recipient: recipient,
            amount: amount,
            executionTime: block.timestamp + WITHDRAWAL_DELAY,
            executed: false,
            canceled: false
        });

        emit WithdrawalQueued(withdrawalCount, token, recipient, amount, block.timestamp + WITHDRAWAL_DELAY);
    }

    /**
     * @notice Executes a queued withdrawal after the 24-hour delay has passed
     */
    function executeWithdrawal(uint256 id) external onlyOwner nonReentrant whenNotPaused {
        require(id > 0 && id <= withdrawalCount, "Invalid withdrawal ID");
        QueuedAgentWithdrawal storage q = queuedWithdrawals[id];
        require(!q.executed, "Already executed");
        require(!q.canceled, "Canceled");
        require(block.timestamp >= q.executionTime, "Timelock not expired");

        q.executed = true;

        if (q.token == address(0)) {
            (bool success, ) = q.recipient.call{value: q.amount}("");
            require(success, "Native transfer failed");
        } else {
            IERC20(q.token).safeTransfer(q.recipient, q.amount);
        }

        emit WithdrawalExecuted(id, q.token, q.recipient, q.amount);
    }

    /**
     * @notice Cancels a queued withdrawal
     */
    function cancelWithdrawal(uint256 id) external onlyOwner whenNotPaused {
        require(id > 0 && id <= withdrawalCount, "Invalid withdrawal ID");
        QueuedAgentWithdrawal storage q = queuedWithdrawals[id];
        require(!q.executed, "Already executed");
        require(!q.canceled, "Already canceled");

        q.canceled = true;
        emit WithdrawalCanceled(id);
    }

    // View helper for queued withdrawals
    function getQueuedWithdrawals() external view returns (QueuedAgentWithdrawal[] memory) {
        QueuedAgentWithdrawal[] memory list = new QueuedAgentWithdrawal[](withdrawalCount);
        for (uint256 i = 1; i <= withdrawalCount; i++) {
            list[i - 1] = queuedWithdrawals[i];
        }
        return list;
    }
}
