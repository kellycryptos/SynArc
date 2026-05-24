// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SynArcTreasury is Ownable {
    address public governor;
    address public usdcToken;

    struct Transaction {
        string txType; // "Inflow" or "Outflow"
        address party;
        uint256 amount;
        string description;
        uint256 timestamp;
    }

    Transaction[] public transactions;

    event Inflow(address indexed sender, uint256 amount, string description, uint256 timestamp);
    event Outflow(address indexed recipient, uint256 amount, string description, uint256 timestamp);

    modifier onlyGovernor() {
        require(msg.sender == governor, "Only governor can call");
        _;
    }

    constructor(address _usdcToken) Ownable(msg.sender) {
        governor = msg.sender; // set temp governor to deployer first
        usdcToken = _usdcToken;
    }

    function setGovernor(address _governor) external onlyOwner {
        governor = _governor;
    }

    function deposit(uint256 amount, string memory description) external {
        IERC20(usdcToken).transferFrom(msg.sender, address(this), amount);
        transactions.push(Transaction("Inflow", msg.sender, amount, description, block.timestamp));
        emit Inflow(msg.sender, amount, description, block.timestamp);
    }

    function withdraw(address recipient, uint256 amount) external onlyGovernor {
        IERC20(usdcToken).transfer(recipient, amount);
        transactions.push(Transaction("Outflow", recipient, amount, "Governance approved withdraw", block.timestamp));
        emit Outflow(recipient, amount, "Governance approved withdraw", block.timestamp);
    }

    function balance() external view returns (uint256) {
        return IERC20(usdcToken).balanceOf(address(this));
    }

    function getTransactions() external view returns (Transaction[] memory) {
        return transactions;
    }
}
