// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract SynArcTreasury is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    address public governor;
    address public usdcToken;
    address public eurcToken;
    address public agentAddress;

    uint256 public usdcBalance;
    uint256 public eurcBalance;

    struct Transaction {
        string txType; // "Inflow" or "Outflow"
        address party;
        uint256 amount;
        string tokenSymbol; // "USDC" or "EURC"
        string description;
        uint256 timestamp;
    }

    struct QueuedWithdrawal {
        uint256 id;
        address recipient;
        uint256 amount;
        address token;
        string tokenSymbol;
        string description;
        uint256 executionTime;
        bool executed;
        bool canceled;
    }

    Transaction[] public transactions;
    
    // Withdrawal Queue mapping and counter
    mapping(uint256 => QueuedWithdrawal) public queuedWithdrawals;
    uint256 public withdrawalCount;
    uint256 public withdrawalDelay = 86400; // 24 hours delay default

    event DepositUSDC(address indexed depositor, uint256 amount, uint256 timestamp);
    event DepositEURC(address indexed depositor, uint256 amount, uint256 timestamp);
    event WithdrawalUSDC(address indexed recipient, uint256 amount, uint256 timestamp);
    event WithdrawalEURC(address indexed recipient, uint256 amount, uint256 timestamp);

    event Inflow(address indexed sender, uint256 amount, string tokenSymbol, string description, uint256 timestamp);
    event Outflow(address indexed recipient, uint256 amount, string tokenSymbol, string description, uint256 timestamp);

    event WithdrawalQueued(
        uint256 indexed id,
        address indexed recipient,
        uint256 amount,
        address token,
        string tokenSymbol,
        uint256 executionTime
    );
    event WithdrawalExecuted(uint256 indexed id, address indexed recipient, uint256 amount, address token);
    event WithdrawalCanceled(uint256 indexed id);
    event WithdrawalDelayUpdated(uint256 oldDelay, uint256 newDelay);

    modifier onlyGovernor() {
        require(msg.sender == governor, "Only governor can call");
        _;
    }

    modifier onlyGovernorOrOwner() {
        require(msg.sender == governor || msg.sender == owner(), "Only governor or owner can call");
        _;
    }

    constructor(address _usdcToken, address _eurcToken) Ownable(msg.sender) {
        governor = msg.sender; // set temp governor to deployer first
        usdcToken = _usdcToken;
        eurcToken = _eurcToken;
    }

    function setGovernor(address _governor) external onlyOwner {
        governor = _governor;
    }

    function setAgentAddress(address _agentAddress) external onlyOwner {
        agentAddress = _agentAddress;
    }

    // Configure withdrawal delay (minimum 24 hours)
    function setWithdrawalDelay(uint256 newDelay) external onlyGovernorOrOwner {
        require(newDelay >= 86400, "Delay must be at least 24 hours");
        emit WithdrawalDelayUpdated(withdrawalDelay, newDelay);
        withdrawalDelay = newDelay;
    }

    // Pause / Unpause deposits & execution (owner only in emergency)
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Deposit USDC
    function depositUSDC(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        IERC20(usdcToken).safeTransferFrom(msg.sender, address(this), amount);
        usdcBalance += amount;
        
        transactions.push(Transaction("Inflow", msg.sender, amount, "USDC", "USDC Deposit", block.timestamp));
        emit DepositUSDC(msg.sender, amount, block.timestamp);
        emit Inflow(msg.sender, amount, "USDC", "USDC Deposit", block.timestamp);
    }

    // Deposit EURC
    function depositEURC(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        IERC20(eurcToken).safeTransferFrom(msg.sender, address(this), amount);
        eurcBalance += amount;
        
        transactions.push(Transaction("Inflow", msg.sender, amount, "EURC", "EURC Deposit", block.timestamp));
        emit DepositEURC(msg.sender, amount, block.timestamp);
        emit Inflow(msg.sender, amount, "EURC", "EURC Deposit", block.timestamp);
    }

    // Withdrawal queueing functions (governor only, subject to timelock)
    function withdrawUSDC(address recipient, uint256 amount) external onlyGovernor nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(usdcBalance >= amount, "Insufficient USDC balance");
        usdcBalance -= amount; // Reserved immediately
        
        withdrawalCount++;
        queuedWithdrawals[withdrawalCount] = QueuedWithdrawal({
            id: withdrawalCount,
            recipient: recipient,
            amount: amount,
            token: usdcToken,
            tokenSymbol: "USDC",
            description: "Governance approved USDC withdraw",
            executionTime: block.timestamp + withdrawalDelay,
            executed: false,
            canceled: false
        });

        emit WithdrawalQueued(withdrawalCount, recipient, amount, usdcToken, "USDC", block.timestamp + withdrawalDelay);
    }

    function withdrawEURC(address recipient, uint256 amount) external onlyGovernor nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(eurcBalance >= amount, "Insufficient EURC balance");
        eurcBalance -= amount; // Reserved immediately
        
        withdrawalCount++;
        queuedWithdrawals[withdrawalCount] = QueuedWithdrawal({
            id: withdrawalCount,
            recipient: recipient,
            amount: amount,
            token: eurcToken,
            tokenSymbol: "EURC",
            description: "Governance approved EURC withdraw",
            executionTime: block.timestamp + withdrawalDelay,
            executed: false,
            canceled: false
        });

        emit WithdrawalQueued(withdrawalCount, recipient, amount, eurcToken, "EURC", block.timestamp + withdrawalDelay);
    }

    // Legacy withdrawal compatibility for Governor contract calls
    function withdraw(address recipient, uint256 amount) external onlyGovernor nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(usdcBalance >= amount, "Insufficient USDC balance");
        usdcBalance -= amount; // Reserved immediately
        
        if (recipient == agentAddress || recipient == owner()) {
            // Bypass 24h timelock for authorized rebalance agents or owner withdrawals
            IERC20(usdcToken).safeTransfer(recipient, amount);
            transactions.push(Transaction("Outflow", recipient, amount, "USDC", "Governance approved instant withdraw", block.timestamp));
            emit Outflow(recipient, amount, "USDC", "Governance approved instant withdraw", block.timestamp);
        } else {
            withdrawalCount++;
            queuedWithdrawals[withdrawalCount] = QueuedWithdrawal({
                id: withdrawalCount,
                recipient: recipient,
                amount: amount,
                token: usdcToken,
                tokenSymbol: "USDC",
                description: "Governance approved withdraw",
                executionTime: block.timestamp + withdrawalDelay,
                executed: false,
                canceled: false
            });
            emit WithdrawalQueued(withdrawalCount, recipient, amount, usdcToken, "USDC", block.timestamp + withdrawalDelay);
        }
    }

    // Execute a queued withdrawal after the delay (anyone can trigger execution when ready)
    function executeWithdrawal(uint256 id) external nonReentrant whenNotPaused {
        require(id > 0 && id <= withdrawalCount, "Invalid withdrawal ID");
        QueuedWithdrawal storage q = queuedWithdrawals[id];
        require(!q.executed, "Already executed");
        require(!q.canceled, "Canceled");
        require(block.timestamp >= q.executionTime, "Timelock not expired");

        q.executed = true;
        IERC20(q.token).safeTransfer(q.recipient, q.amount);

        transactions.push(Transaction("Outflow", q.recipient, q.amount, q.tokenSymbol, q.description, block.timestamp));
        
        if (q.token == usdcToken) {
            emit WithdrawalUSDC(q.recipient, q.amount, block.timestamp);
        } else if (q.token == eurcToken) {
            emit WithdrawalEURC(q.recipient, q.amount, block.timestamp);
        }
        
        emit Outflow(q.recipient, q.amount, q.tokenSymbol, q.description, block.timestamp);
        emit WithdrawalExecuted(id, q.recipient, q.amount, q.token);
    }

    // Cancel a queued withdrawal (emergency action by governor or owner)
    function cancelWithdrawal(uint256 id) external onlyGovernorOrOwner nonReentrant {
        require(id > 0 && id <= withdrawalCount, "Invalid withdrawal ID");
        QueuedWithdrawal storage q = queuedWithdrawals[id];
        require(!q.executed, "Already executed");
        require(!q.canceled, "Already canceled");

        q.canceled = true;
        
        // Restore balance reservation
        if (q.token == usdcToken) {
            usdcBalance += q.amount;
        } else if (q.token == eurcToken) {
            eurcBalance += q.amount;
        }

        emit WithdrawalCanceled(id);
    }

    // Legacy balance view (returns USDC balance)
    function balance() external view returns (uint256) {
        return IERC20(usdcToken).balanceOf(address(this));
    }

    // Generic token balance view
    function tokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    function getTransactions() external view returns (Transaction[] memory) {
        return transactions;
    }

    // Get all queued withdrawals for frontend queries
    function getQueuedWithdrawals() external view returns (QueuedWithdrawal[] memory) {
        QueuedWithdrawal[] memory list = new QueuedWithdrawal[](withdrawalCount);
        for (uint256 i = 1; i <= withdrawalCount; i++) {
            list[i - 1] = queuedWithdrawals[i];
        }
        return list;
    }
}
