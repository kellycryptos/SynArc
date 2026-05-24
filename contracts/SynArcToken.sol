// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SynArcToken is ERC20, Ownable {
    constructor() ERC20("SynArc Governance Token", "sARC") Ownable(msg.sender) {
        // Mint initial supply to deployer (15,000,000 tokens for bootstrap/testing)
        _mint(msg.sender, 15000000 * 10**decimals());
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
