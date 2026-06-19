// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract CanteenUSDC is ERC20 {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdcToken;

    event Wrap(address indexed user, uint256 amount);
    event Unwrap(address indexed user, uint256 amount);

    constructor(address _usdcToken) ERC20("Canteen USDC Wrapper", "canteenUSDC") {
        require(_usdcToken != address(0), "Invalid USDC address");
        usdcToken = IERC20(_usdcToken);
    }

    // Wrap USDC -> canteenUSDC
    function wrap(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        // Transfer USDC from user to this contract
        usdcToken.safeTransferFrom(msg.sender, address(this), amount);
        // Mint canteenUSDC to user
        _mint(msg.sender, amount);
        emit Wrap(msg.sender, amount);
    }

    // Unwrap canteenUSDC -> USDC
    function unwrap(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        // Burn canteenUSDC from user
        _burn(msg.sender, amount);
        // Transfer USDC back to user
        usdcToken.safeTransfer(msg.sender, amount);
        emit Unwrap(msg.sender, amount);
    }

    // Returns the decimals (6 to match USDC)
    function decimals() public view override returns (uint8) {
        return 6;
    }
}
