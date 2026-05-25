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

    Transaction[] public transactions;

    event DepositUSDC(address indexed depositor, uint256 amount, uint256 timestamp);
    event DepositEURC(address indexed depositor, uint256 amount, uint256 timestamp);
    event WithdrawalUSDC(address indexed recipient, uint256 amount, uint256 timestamp);
    event WithdrawalEURC(address indexed recipient, uint256 amount, uint256 timestamp);

    event Inflow(address indexed sender, uint256 amount, string tokenSymbol, string description, uint256 timestamp);
    event Outflow(address indexed recipient, uint256 amount, string tokenSymbol, string description, uint256 timestamp);

    modifier onlyGovernor() {
        require(msg.sender == governor, "Only governor can call");
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

    // Pause / Unpause deposits (owner only in emergency)
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

    // Withdrawal functions (governor only)
    function withdrawUSDC(address recipient, uint256 amount) external onlyGovernor nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(usdcBalance >= amount, "Insufficient USDC balance");
        usdcBalance -= amount;
        IERC20(usdcToken).safeTransfer(recipient, amount);
        
        transactions.push(Transaction("Outflow", recipient, amount, "USDC", "Governance approved USDC withdraw", block.timestamp));
        emit WithdrawalUSDC(recipient, amount, block.timestamp);
        emit Outflow(recipient, amount, "USDC", "Governance approved USDC withdraw", block.timestamp);
    }

    function withdrawEURC(address recipient, uint256 amount) external onlyGovernor nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(eurcBalance >= amount, "Insufficient EURC balance");
        eurcBalance -= amount;
        IERC20(eurcToken).safeTransfer(recipient, amount);
        
        transactions.push(Transaction("Outflow", recipient, amount, "EURC", "Governance approved EURC withdraw", block.timestamp));
        emit WithdrawalEURC(recipient, amount, block.timestamp);
        emit Outflow(recipient, amount, "EURC", "Governance approved EURC withdraw", block.timestamp);
    }

    // Legacy withdrawal compatibility for Governor contract calls
    function withdraw(address recipient, uint256 amount) external onlyGovernor nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(usdcBalance >= amount, "Insufficient USDC balance");
        usdcBalance -= amount;
        IERC20(usdcToken).safeTransfer(recipient, amount);
        
        transactions.push(Transaction("Outflow", recipient, amount, "USDC", "Governance approved withdraw", block.timestamp));
        emit WithdrawalUSDC(recipient, amount, block.timestamp);
        emit Outflow(recipient, amount, "USDC", "Governance approved withdraw", block.timestamp);
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
}
