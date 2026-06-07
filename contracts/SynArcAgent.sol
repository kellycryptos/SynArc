// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

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
contract SynArcAgent is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Official ERC-8004 Identity Registry Address on Arc Testnet
    address public constant ERC8004_REGISTRY = 0x8004A818BFB912233c491871b3d84c89A494BD9e;

    // The authorized hot-wallet script executor address for autonomous triggers
    address public executor;

    // Framework description metadata
    string public frameworkModel;

    event ExecutorUpdated(address indexed oldExecutor, address indexed newExecutor);
    event RegisteredOnERC8004(address indexed registry, string name, string metadataURI);
    event DAOProposalCreated(address indexed governor, uint256 indexed proposalId, string title);
    event CampaignFunded(address indexed campaign, uint256 amount);
    event StrategyExecuted(address indexed targetContract, uint256 amount);

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
    ) external onlyExecutorOrOwner {
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
    ) external onlyExecutorOrOwner returns (uint256) {
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
    ) external onlyExecutorOrOwner nonReentrant {
        require(amount > 0, "Amount must be > 0");
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
    ) external onlyExecutorOrOwner nonReentrant {
        require(amount > 0, "Amount must be > 0");
        
        // Approve spending of target contract
        IERC20(token).approve(targetContract, amount);
        
        // Trigger yield operation or pool sweep
        (bool success, ) = targetContract.call(data);
        require(success, "Yield strategy execution failed");
        
        emit StrategyExecuted(targetContract, amount);
    }

    /**
     * @notice Claims accrued funds and withdraws them back to recipient (e.g. Treasury DAO)
     */
    function withdrawFunds(
        address token,
        address recipient,
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(recipient != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be > 0");
        IERC20(token).safeTransfer(recipient, amount);
    }

    /**
     * @notice Claims any native currency balance
     */
    function withdrawNative(address payable recipient, uint256 amount) external onlyOwner {
        require(recipient != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be > 0");
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Native transfer failed");
    }
}
