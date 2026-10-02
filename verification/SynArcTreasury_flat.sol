Γùç injected env (36) from .env.local // tip: Γùê encrypted .env [www.dotenvx.com]
Γùç injected env (3) from .env // tip: Γùê secrets for agents [www.dotenvx.com]
// Sources flattened with hardhat v2.22.17 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/utils/Context.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File @openzeppelin/contracts/access/Ownable.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File @openzeppelin/contracts/utils/introspection/IERC165.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/introspection/IERC165.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface of the ERC-165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[ERC].
 *
 * Implementers can declare support of contract interfaces, which can then be
 * queried by others ({ERC165Checker}).
 *
 * For an implementation, see {ERC165}.
 */
interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[ERC section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}


// File @openzeppelin/contracts/interfaces/IERC165.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC165.sol)

pragma solidity >=0.4.16;


// File @openzeppelin/contracts/token/ERC20/IERC20.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/IERC20.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}


// File @openzeppelin/contracts/interfaces/IERC20.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC20.sol)

pragma solidity >=0.4.16;


// File @openzeppelin/contracts/interfaces/IERC1363.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC1363.sol)

pragma solidity >=0.6.2;


/**
 * @title IERC1363
 * @dev Interface of the ERC-1363 standard as defined in the https://eips.ethereum.org/EIPS/eip-1363[ERC-1363].
 *
 * Defines an extension interface for ERC-20 tokens that supports executing code on a recipient contract
 * after `transfer` or `transferFrom`, or code on a spender contract after `approve`, in a single transaction.
 */
interface IERC1363 is IERC20, IERC165 {
    /*
     * Note: the ERC-165 identifier for this interface is 0xb0202a11.
     * 0xb0202a11 ===
     *   bytes4(keccak256('transferAndCall(address,uint256)')) ^
     *   bytes4(keccak256('transferAndCall(address,uint256,bytes)')) ^
     *   bytes4(keccak256('transferFromAndCall(address,address,uint256)')) ^
     *   bytes4(keccak256('transferFromAndCall(address,address,uint256,bytes)')) ^
     *   bytes4(keccak256('approveAndCall(address,uint256)')) ^
     *   bytes4(keccak256('approveAndCall(address,uint256,bytes)'))
     */

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferAndCall(address to, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @param data Additional data with no specified format, sent in call to `to`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferAndCall(address to, uint256 value, bytes calldata data) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the allowance mechanism
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param from The address which you want to send tokens from.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferFromAndCall(address from, address to, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the allowance mechanism
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param from The address which you want to send tokens from.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @param data Additional data with no specified format, sent in call to `to`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferFromAndCall(address from, address to, uint256 value, bytes calldata data) external returns (bool);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens and then calls {IERC1363Spender-onApprovalReceived} on `spender`.
     * @param spender The address which will spend the funds.
     * @param value The amount of tokens to be spent.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function approveAndCall(address spender, uint256 value) external returns (bool);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens and then calls {IERC1363Spender-onApprovalReceived} on `spender`.
     * @param spender The address which will spend the funds.
     * @param value The amount of tokens to be spent.
     * @param data Additional data with no specified format, sent in call to `spender`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function approveAndCall(address spender, uint256 value, bytes calldata data) external returns (bool);
}


// File @openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (token/ERC20/utils/SafeERC20.sol)

pragma solidity ^0.8.20;


/**
 * @title SafeERC20
 * @dev Wrappers around ERC-20 operations that throw on failure (when the token
 * contract returns false). Tokens that return no value (and instead revert or
 * throw on failure) are also supported, non-reverting calls are assumed to be
 * successful.
 * To use this library you can add a `using SafeERC20 for IERC20;` statement to your contract,
 * which allows you to call the safe operations as `token.safeTransfer(...)`, etc.
 */
library SafeERC20 {
    /**
     * @dev An operation with an ERC-20 token failed.
     */
    error SafeERC20FailedOperation(address token);

    /**
     * @dev Indicates a failed `decreaseAllowance` request.
     */
    error SafeERC20FailedDecreaseAllowance(address spender, uint256 currentAllowance, uint256 requestedDecrease);

    /**
     * @dev Transfer `value` amount of `token` from the calling contract to `to`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     */
    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        if (!_safeTransfer(token, to, value, true)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Transfer `value` amount of `token` from `from` to `to`, spending the approval given by `from` to the
     * calling contract. If `token` returns no value, non-reverting calls are assumed to be successful.
     */
    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        if (!_safeTransferFrom(token, from, to, value, true)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Variant of {safeTransfer} that returns a bool instead of reverting if the operation is not successful.
     */
    function trySafeTransfer(IERC20 token, address to, uint256 value) internal returns (bool) {
        return _safeTransfer(token, to, value, false);
    }

    /**
     * @dev Variant of {safeTransferFrom} that returns a bool instead of reverting if the operation is not successful.
     */
    function trySafeTransferFrom(IERC20 token, address from, address to, uint256 value) internal returns (bool) {
        return _safeTransferFrom(token, from, to, value, false);
    }

    /**
     * @dev Increase the calling contract's allowance toward `spender` by `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     *
     * IMPORTANT: If the token implements ERC-7674 (ERC-20 with temporary allowance), and if the "client"
     * smart contract uses ERC-7674 to set temporary allowances, then the "client" smart contract should avoid using
     * this function. Performing a {safeIncreaseAllowance} or {safeDecreaseAllowance} operation on a token contract
     * that has a non-zero temporary allowance (for that particular owner-spender) will result in unexpected behavior.
     */
    function safeIncreaseAllowance(IERC20 token, address spender, uint256 value) internal {
        uint256 oldAllowance = token.allowance(address(this), spender);
        forceApprove(token, spender, oldAllowance + value);
    }

    /**
     * @dev Decrease the calling contract's allowance toward `spender` by `requestedDecrease`. If `token` returns no
     * value, non-reverting calls are assumed to be successful.
     *
     * IMPORTANT: If the token implements ERC-7674 (ERC-20 with temporary allowance), and if the "client"
     * smart contract uses ERC-7674 to set temporary allowances, then the "client" smart contract should avoid using
     * this function. Performing a {safeIncreaseAllowance} or {safeDecreaseAllowance} operation on a token contract
     * that has a non-zero temporary allowance (for that particular owner-spender) will result in unexpected behavior.
     */
    function safeDecreaseAllowance(IERC20 token, address spender, uint256 requestedDecrease) internal {
        unchecked {
            uint256 currentAllowance = token.allowance(address(this), spender);
            if (currentAllowance < requestedDecrease) {
                revert SafeERC20FailedDecreaseAllowance(spender, currentAllowance, requestedDecrease);
            }
            forceApprove(token, spender, currentAllowance - requestedDecrease);
        }
    }

    /**
     * @dev Set the calling contract's allowance toward `spender` to `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful. Meant to be used with tokens that require the approval
     * to be set to zero before setting it to a non-zero value, such as USDT.
     *
     * NOTE: If the token implements ERC-7674, this function will not modify any temporary allowance. This function
     * only sets the "standard" allowance. Any temporary allowance will remain active, in addition to the value being
     * set here.
     */
    function forceApprove(IERC20 token, address spender, uint256 value) internal {
        if (!_safeApprove(token, spender, value, false)) {
            if (!_safeApprove(token, spender, 0, true)) revert SafeERC20FailedOperation(address(token));
            if (!_safeApprove(token, spender, value, true)) revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Performs an {ERC1363} transferAndCall, with a fallback to the simple {ERC20} transfer if the target has no
     * code. This can be used to implement an {ERC721}-like safe transfer that relies on {ERC1363} checks when
     * targeting contracts.
     *
     * Reverts if the returned value is other than `true`.
     */
    function transferAndCallRelaxed(IERC1363 token, address to, uint256 value, bytes memory data) internal {
        if (to.code.length == 0) {
            safeTransfer(token, to, value);
        } else if (!token.transferAndCall(to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Performs an {ERC1363} transferFromAndCall, with a fallback to the simple {ERC20} transferFrom if the target
     * has no code. This can be used to implement an {ERC721}-like safe transfer that relies on {ERC1363} checks when
     * targeting contracts.
     *
     * Reverts if the returned value is other than `true`.
     */
    function transferFromAndCallRelaxed(
        IERC1363 token,
        address from,
        address to,
        uint256 value,
        bytes memory data
    ) internal {
        if (to.code.length == 0) {
            safeTransferFrom(token, from, to, value);
        } else if (!token.transferFromAndCall(from, to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Performs an {ERC1363} approveAndCall, with a fallback to the simple {ERC20} approve if the target has no
     * code. This can be used to implement an {ERC721}-like safe transfer that rely on {ERC1363} checks when
     * targeting contracts.
     *
     * NOTE: When the recipient address (`to`) has no code (i.e. is an EOA), this function behaves as {forceApprove}.
     * Oppositely, when the recipient address (`to`) has code, this function only attempts to call {ERC1363-approveAndCall}
     * once without retrying, and relies on the returned value to be true.
     *
     * Reverts if the returned value is other than `true`.
     */
    function approveAndCallRelaxed(IERC1363 token, address to, uint256 value, bytes memory data) internal {
        if (to.code.length == 0) {
            forceApprove(token, to, value);
        } else if (!token.approveAndCall(to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Imitates a Solidity `token.transfer(to, value)` call, relaxing the requirement on the return value: the
     * return value is optional (but if data is returned, it must not be false).
     *
     * @param token The token targeted by the call.
     * @param to The recipient of the tokens
     * @param value The amount of token to transfer
     * @param bubble Behavior switch if the transfer call reverts: bubble the revert reason or return a false boolean.
     */
    function _safeTransfer(IERC20 token, address to, uint256 value, bool bubble) private returns (bool success) {
        bytes4 selector = IERC20.transfer.selector;

        assembly ("memory-safe") {
            let fmp := mload(0x40)
            mstore(0x00, selector)
            mstore(0x04, and(to, shr(96, not(0))))
            mstore(0x24, value)
            success := call(gas(), token, 0, 0x00, 0x44, 0x00, 0x20)
            // if call success and return is true, all is good.
            // otherwise (not success or return is not true), we need to perform further checks
            if iszero(and(success, eq(mload(0x00), 1))) {
                // if the call was a failure and bubble is enabled, bubble the error
                if and(iszero(success), bubble) {
                    returndatacopy(fmp, 0x00, returndatasize())
                    revert(fmp, returndatasize())
                }
                // if the return value is not true, then the call is only successful if:
                // - the token address has code
                // - the returndata is empty
                success := and(success, and(iszero(returndatasize()), gt(extcodesize(token), 0)))
            }
            mstore(0x40, fmp)
        }
    }

    /**
     * @dev Imitates a Solidity `token.transferFrom(from, to, value)` call, relaxing the requirement on the return
     * value: the return value is optional (but if data is returned, it must not be false).
     *
     * @param token The token targeted by the call.
     * @param from The sender of the tokens
     * @param to The recipient of the tokens
     * @param value The amount of token to transfer
     * @param bubble Behavior switch if the transfer call reverts: bubble the revert reason or return a false boolean.
     */
    function _safeTransferFrom(
        IERC20 token,
        address from,
        address to,
        uint256 value,
        bool bubble
    ) private returns (bool success) {
        bytes4 selector = IERC20.transferFrom.selector;

        assembly ("memory-safe") {
            let fmp := mload(0x40)
            mstore(0x00, selector)
            mstore(0x04, and(from, shr(96, not(0))))
            mstore(0x24, and(to, shr(96, not(0))))
            mstore(0x44, value)
            success := call(gas(), token, 0, 0x00, 0x64, 0x00, 0x20)
            // if call success and return is true, all is good.
            // otherwise (not success or return is not true), we need to perform further checks
            if iszero(and(success, eq(mload(0x00), 1))) {
                // if the call was a failure and bubble is enabled, bubble the error
                if and(iszero(success), bubble) {
                    returndatacopy(fmp, 0x00, returndatasize())
                    revert(fmp, returndatasize())
                }
                // if the return value is not true, then the call is only successful if:
                // - the token address has code
                // - the returndata is empty
                success := and(success, and(iszero(returndatasize()), gt(extcodesize(token), 0)))
            }
            mstore(0x40, fmp)
            mstore(0x60, 0)
        }
    }

    /**
     * @dev Imitates a Solidity `token.approve(spender, value)` call, relaxing the requirement on the return value:
     * the return value is optional (but if data is returned, it must not be false).
     *
     * @param token The token targeted by the call.
     * @param spender The spender of the tokens
     * @param value The amount of token to transfer
     * @param bubble Behavior switch if the transfer call reverts: bubble the revert reason or return a false boolean.
     */
    function _safeApprove(IERC20 token, address spender, uint256 value, bool bubble) private returns (bool success) {
        bytes4 selector = IERC20.approve.selector;

        assembly ("memory-safe") {
            let fmp := mload(0x40)
            mstore(0x00, selector)
            mstore(0x04, and(spender, shr(96, not(0))))
            mstore(0x24, value)
            success := call(gas(), token, 0, 0x00, 0x44, 0x00, 0x20)
            // if call success and return is true, all is good.
            // otherwise (not success or return is not true), we need to perform further checks
            if iszero(and(success, eq(mload(0x00), 1))) {
                // if the call was a failure and bubble is enabled, bubble the error
                if and(iszero(success), bubble) {
                    returndatacopy(fmp, 0x00, returndatasize())
                    revert(fmp, returndatasize())
                }
                // if the return value is not true, then the call is only successful if:
                // - the token address has code
                // - the returndata is empty
                success := and(success, and(iszero(returndatasize()), gt(extcodesize(token), 0)))
            }
            mstore(0x40, fmp)
        }
    }
}


// File @openzeppelin/contracts/utils/Pausable.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (utils/Pausable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract Pausable is Context {
    bool private _paused;

    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    /**
     * @dev The operation failed because the contract is paused.
     */
    error EnforcedPause();

    /**
     * @dev The operation failed because the contract is not paused.
     */
    error ExpectedPause();

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Throws if the contract is paused.
     */
    function _requireNotPaused() internal view virtual {
        if (paused()) {
            revert EnforcedPause();
        }
    }

    /**
     * @dev Throws if the contract is not paused.
     */
    function _requirePaused() internal view virtual {
        if (!paused()) {
            revert ExpectedPause();
        }
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}


// File @openzeppelin/contracts/utils/StorageSlot.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/StorageSlot.sol)
// This file was procedurally generated from scripts/generate/templates/StorageSlot.js.

pragma solidity ^0.8.20;

/**
 * @dev Library for reading and writing primitive types to specific storage slots.
 *
 * Storage slots are often used to avoid storage conflict when dealing with upgradeable contracts.
 * This library helps with reading and writing to such slots without the need for inline assembly.
 *
 * The functions in this library return Slot structs that contain a `value` member that can be used to read or write.
 *
 * Example usage to set ERC-1967 implementation slot:
 * ```solidity
 * contract ERC1967 {
 *     // Define the slot. Alternatively, use the SlotDerivation library to derive the slot.
 *     bytes32 internal constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
 *
 *     function _getImplementation() internal view returns (address) {
 *         return StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value;
 *     }
 *
 *     function _setImplementation(address newImplementation) internal {
 *         require(newImplementation.code.length > 0);
 *         StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value = newImplementation;
 *     }
 * }
 * ```
 *
 * TIP: Consider using this library along with {SlotDerivation}.
 */
library StorageSlot {
    struct AddressSlot {
        address value;
    }

    struct BooleanSlot {
        bool value;
    }

    struct Bytes32Slot {
        bytes32 value;
    }

    struct Uint256Slot {
        uint256 value;
    }

    struct Int256Slot {
        int256 value;
    }

    struct StringSlot {
        string value;
    }

    struct BytesSlot {
        bytes value;
    }

    /**
     * @dev Returns an `AddressSlot` with member `value` located at `slot`.
     */
    function getAddressSlot(bytes32 slot) internal pure returns (AddressSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `BooleanSlot` with member `value` located at `slot`.
     */
    function getBooleanSlot(bytes32 slot) internal pure returns (BooleanSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `Bytes32Slot` with member `value` located at `slot`.
     */
    function getBytes32Slot(bytes32 slot) internal pure returns (Bytes32Slot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `Uint256Slot` with member `value` located at `slot`.
     */
    function getUint256Slot(bytes32 slot) internal pure returns (Uint256Slot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `Int256Slot` with member `value` located at `slot`.
     */
    function getInt256Slot(bytes32 slot) internal pure returns (Int256Slot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `StringSlot` with member `value` located at `slot`.
     */
    function getStringSlot(bytes32 slot) internal pure returns (StringSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns an `StringSlot` representation of the string storage pointer `store`.
     */
    function getStringSlot(string storage store) internal pure returns (StringSlot storage r) {
        assembly ("memory-safe") {
            r.slot := store.slot
        }
    }

    /**
     * @dev Returns a `BytesSlot` with member `value` located at `slot`.
     */
    function getBytesSlot(bytes32 slot) internal pure returns (BytesSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns an `BytesSlot` representation of the bytes storage pointer `store`.
     */
    function getBytesSlot(bytes storage store) internal pure returns (BytesSlot storage r) {
        assembly ("memory-safe") {
            r.slot := store.slot
        }
    }
}


// File @openzeppelin/contracts/utils/ReentrancyGuard.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (utils/ReentrancyGuard.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 *
 * IMPORTANT: Deprecated. This storage-based reentrancy guard will be removed and replaced
 * by the {ReentrancyGuardTransient} variant in v6.0.
 *
 * @custom:stateless
 */
abstract contract ReentrancyGuard {
    using StorageSlot for bytes32;

    // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.ReentrancyGuard")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant REENTRANCY_GUARD_STORAGE =
        0x9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00;

    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _reentrancyGuardStorageSlot().getUint256Slot().value = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    /**
     * @dev A `view` only version of {nonReentrant}. Use to block view functions
     * from being called, preventing reading from inconsistent contract state.
     *
     * CAUTION: This is a "view" modifier and does not change the reentrancy
     * status. Use it only on view functions. For payable or non-payable functions,
     * use the standard {nonReentrant} modifier instead.
     */
    modifier nonReentrantView() {
        _nonReentrantBeforeView();
        _;
    }

    function _nonReentrantBeforeView() private view {
        if (_reentrancyGuardEntered()) {
            revert ReentrancyGuardReentrantCall();
        }
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        _nonReentrantBeforeView();

        // Any calls to nonReentrant after this point will fail
        _reentrancyGuardStorageSlot().getUint256Slot().value = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _reentrancyGuardStorageSlot().getUint256Slot().value = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _reentrancyGuardStorageSlot().getUint256Slot().value == ENTERED;
    }

    function _reentrancyGuardStorageSlot() internal pure virtual returns (bytes32) {
        return REENTRANCY_GUARD_STORAGE;
    }
}


// File contracts/SynArcTreasury.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;





interface ISynArcGovernor {
    enum ProposalState { Pending, Active, Canceled, Defeated, Succeeded, Queued, Expired, Executed }
    function state(uint256 proposalId) external view returns (ProposalState);
    function getProposalExecutionData(uint256 proposalId) external view returns (
        address executionTarget,
        uint256 treasuryImpactValue,
        bytes32 deliverableHash,
        string memory deliverableURI,
        ProposalState proposalState
    );
}

/**
 * @title SynArcTreasury
 * @notice Enterprise DAO Treasury enforcing strict on-chain Three-Way Matching (Order, Receipt, Invoice),
 * document-anchored entries (Odoo pattern), payee substitution defense with timelocked cooldowns,
 * deterministic model-as-input attestation gates with multisig/human review thresholds, loud reverts
 * without silent round-offs, idempotency guards, and dry-run release simulation.
 */
contract SynArcTreasury is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // --- Custom Errors (Failure is Loud: Revert with auditable diagnostic params) ---
    error OrderNotFound(uint256 proposalId, uint256 milestoneId);
    error OrderNotApproved(uint256 proposalId);
    error DocumentReceiptMismatch(bytes32 expected, bytes32 actual);
    error AmountMismatch(uint256 expected, uint256 actual);
    error PayeeMismatch(address expected, address actual);
    error PayeeCooldownActive(address pendingTarget, uint256 cooldownExpiry);
    error DuplicateRelease(bytes32 releaseKey);
    error LowConfidenceScore(uint8 score, uint8 requiredScore);
    error HumanApprovalRequired(bytes32 releaseKey, uint256 amount, uint256 threshold);
    error InsufficientTreasuryBalance(uint256 available, uint256 required);
    error InvalidRecipient();
    error InvalidAmount();
    error CooldownNotExpired(uint256 currentTimestamp, uint256 requiredTimestamp);
    error NoPendingPayeeChange(uint256 proposalId);

    // --- Contract State ---
    address public governor;
    address public usdcToken;
    address public eurcToken;
    address public agentAddress;

    uint256 public usdcBalance;
    uint256 public eurcBalance;

    // Safety & Governance Thresholds
    uint256 public humanReviewThreshold = 50 * 10**6; // 50 USDC default
    uint8 public minConfidenceScore = 80;             // 80% default minimum AI attestation confidence
    uint256 public payeeChangeCooldown = 2 days;       // 48h cooldown on payout recipient updates

    // Role authorizations for release valve
    mapping(address => bool) public authorizedAgents;
    mapping(address => bool) public authorizedHumanReviewers;

    event AgentAuthorizationUpdated(address indexed agent, bool authorized);
    event HumanReviewerUpdated(address indexed reviewer, bool authorized);
    event AgentReleaseCapUpdated(uint256 oldCap, uint256 newCap);

    // --- Data Structures ---
    struct OrderTerms {
        uint256 proposalId;
        uint256 milestoneId;
        address recipient;
        uint256 amount;
        bytes32 expectedDocumentHash;
        string deliverableURI;
        bool exists;
    }

    struct ReleaseEntry {
        uint256 proposalId;
        uint256 milestoneId;
        bytes32 documentHash;
        bytes32 invoiceHash;
        address recipient;
        uint256 amount;
        uint256 timestamp;
        bool executed;
    }

    struct PayeeRecord {
        address currentTarget;
        address pendingTarget;
        uint256 cooldownExpiry;
        bool hasPendingChange;
    }

    struct SimulationResult {
        bool canRelease;
        bool isDuplicate;
        bool orderMatches;
        bool receiptMatches;
        bool invoiceMatches;
        bool payeeMatches;
        bool payeeCooldownActive;
        bool requiresHumanApproval;
        bool sufficientBalance;
        string statusMessage;
        uint256 returnCode; // 200 = Success, 201 = Human Review Required, 400+ = Error
    }

    struct Transaction {
        string txType; // "Inflow" or "Outflow"
        address party;
        uint256 amount;
        string tokenSymbol; // "USDC" or "EURC"
        string description;
        uint256 timestamp;
        string deliverableURI;
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
        string deliverableURI;
    }

    // --- Storage Mappings ---
    Transaction[] public transactions;
    
    // Explicit document release registry (orderKey = keccak256(proposalId, milestoneId))
    mapping(bytes32 => OrderTerms) public registeredOrders;

    // Idempotency guards
    mapping(bytes32 => bool) public executedReleases; // releaseKey = keccak256(proposalId, milestoneId, invoiceHash)
    mapping(uint256 => bool) public proposalReleased; // Legacy proposal idempotency guard

    // Document entries
    mapping(bytes32 => ReleaseEntry) public releaseEntries;
    ReleaseEntry[] public allReleaseEntries;

    // Payee substitution defense
    mapping(uint256 => PayeeRecord) public proposalPayees;

    // Human/Multisig approval gate
    mapping(bytes32 => bool) public humanApproved;

    // Withdrawal Queue mapping and counter
    mapping(uint256 => QueuedWithdrawal) public queuedWithdrawals;
    uint256 public withdrawalCount;
    uint256 public withdrawalDelay = 86400; // 24 hours delay default

    // --- Events ---
    event DepositUSDC(address indexed depositor, uint256 amount, uint256 timestamp);
    event DepositEURC(address indexed depositor, uint256 amount, uint256 timestamp);
    event WithdrawalUSDC(address indexed recipient, uint256 amount, uint256 timestamp);
    event WithdrawalEURC(address indexed recipient, uint256 amount, uint256 timestamp);

    event Inflow(address indexed sender, uint256 amount, string tokenSymbol, string description, uint256 timestamp);
    event Outflow(address indexed recipient, uint256 amount, string tokenSymbol, string description, uint256 timestamp, string deliverableURI);

    event OrderRegistered(
        uint256 indexed proposalId,
        uint256 indexed milestoneId,
        address indexed recipient,
        uint256 amount,
        bytes32 expectedDocumentHash
    );

    event ThreeWayMatchSuccess(
        bytes32 indexed releaseKey,
        uint256 indexed proposalId,
        uint256 indexed milestoneId,
        bytes32 documentHash,
        bytes32 invoiceHash,
        address recipient,
        uint256 amount
    );

    event PayeeChangeRequested(
        uint256 indexed proposalId,
        address indexed oldTarget,
        address indexed newTarget,
        uint256 cooldownExpiry
    );

    event PayeeChangeConfirmed(
        uint256 indexed proposalId,
        address indexed oldTarget,
        address indexed newTarget
    );

    event HumanApprovalGranted(bytes32 indexed releaseKey, address indexed approver);
    event HumanReviewThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event MinConfidenceScoreUpdated(uint8 oldScore, uint8 newScore);
    event PayeeChangeCooldownUpdated(uint256 oldCooldown, uint256 newCooldown);

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

    // --- Modifiers ---
    modifier onlyGovernor() {
        require(msg.sender == governor, "Only governor");
        _;
    }

    modifier onlyGovernorOrOwner() {
        require(msg.sender == governor || msg.sender == owner(), "Only governor or owner");
        _;
    }

    constructor(address _usdcToken, address _eurcToken) Ownable(msg.sender) {
        governor = msg.sender;
        usdcToken = _usdcToken;
        eurcToken = _eurcToken;
    }

    function setGovernor(address _governor) external onlyOwner {
        require(_governor != address(0), "Invalid governor address");
        governor = _governor;
    }

    function setAgentAddress(address _agentAddress) external onlyOwner {
        agentAddress = _agentAddress;
        if (_agentAddress != address(0)) {
            authorizedAgents[_agentAddress] = true;
            emit AgentAuthorizationUpdated(_agentAddress, true);
        }
    }

    function setAuthorizedAgent(address agent, bool authorized) external onlyGovernorOrOwner {
        require(agent != address(0), "Invalid agent address");
        authorizedAgents[agent] = authorized;
        emit AgentAuthorizationUpdated(agent, authorized);
    }

    function setAuthorizedHumanReviewer(address reviewer, bool authorized) external onlyGovernorOrOwner {
        require(reviewer != address(0), "Invalid reviewer address");
        authorizedHumanReviewers[reviewer] = authorized;
        emit HumanReviewerUpdated(reviewer, authorized);
    }

    function isAuthorizedAgent(address account) public view returns (bool) {
        return account == agentAddress || authorizedAgents[account];
    }

    function isAuthorizedReviewer(address account) public view returns (bool) {
        return account == governor || account == owner() || authorizedHumanReviewers[account];
    }

    function agentReleaseCap() external view returns (uint256) {
        return humanReviewThreshold;
    }

    function setAgentReleaseCap(uint256 newCap) external onlyGovernorOrOwner {
        emit HumanReviewThresholdUpdated(humanReviewThreshold, newCap);
        emit AgentReleaseCapUpdated(humanReviewThreshold, newCap);
        humanReviewThreshold = newCap;
    }

    function setWithdrawalDelay(uint256 newDelay) external onlyGovernorOrOwner {
        require(newDelay >= 86400, "Delay must be at least 24 hours");
        emit WithdrawalDelayUpdated(withdrawalDelay, newDelay);
        withdrawalDelay = newDelay;
    }

    function setHumanReviewThreshold(uint256 newThreshold) external onlyGovernorOrOwner {
        emit HumanReviewThresholdUpdated(humanReviewThreshold, newThreshold);
        emit AgentReleaseCapUpdated(humanReviewThreshold, newThreshold);
        humanReviewThreshold = newThreshold;
    }

    function setMinConfidenceScore(uint8 newScore) external onlyGovernorOrOwner {
        require(newScore <= 100, "Invalid score");
        emit MinConfidenceScoreUpdated(minConfidenceScore, newScore);
        minConfidenceScore = newScore;
    }

    function setPayeeChangeCooldown(uint256 newCooldown) external onlyGovernorOrOwner {
        emit PayeeChangeCooldownUpdated(payeeChangeCooldown, newCooldown);
        payeeChangeCooldown = newCooldown;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // --- Order Registration (Document is the Entry) ---
    function registerOrder(
        uint256 proposalId,
        uint256 milestoneId,
        address recipient,
        uint256 amount,
        bytes32 expectedDocumentHash,
        string calldata deliverableURI
    ) external onlyGovernorOrOwner {
        if (recipient == address(0)) revert InvalidRecipient();
        if (amount == 0) revert InvalidAmount();
        bytes32 orderKey = keccak256(abi.encodePacked(proposalId, milestoneId));

        registeredOrders[orderKey] = OrderTerms({
            proposalId: proposalId,
            milestoneId: milestoneId,
            recipient: recipient,
            amount: amount,
            expectedDocumentHash: expectedDocumentHash,
            deliverableURI: deliverableURI,
            exists: true
        });

        emit OrderRegistered(proposalId, milestoneId, recipient, amount, expectedDocumentHash);
    }

    function _resolveCurrentPayee(uint256 proposalId) internal view returns (address) {
        if (proposalPayees[proposalId].currentTarget != address(0)) {
            return proposalPayees[proposalId].currentTarget;
        }
        bytes32 orderKey1 = keccak256(abi.encodePacked(proposalId, uint256(1)));
        if (registeredOrders[orderKey1].exists) {
            return registeredOrders[orderKey1].recipient;
        }
        bytes32 orderKey0 = keccak256(abi.encodePacked(proposalId, uint256(0)));
        if (registeredOrders[orderKey0].exists) {
            return registeredOrders[orderKey0].recipient;
        }
        if (governor != address(0)) {
            try ISynArcGovernor(governor).getProposalExecutionData(proposalId) returns (
                address target, uint256, bytes32, string memory, ISynArcGovernor.ProposalState
            ) {
                return target;
            } catch {}
        }
        return address(0);
    }

    // --- Payee Substitution Defense: Change Tracking with Cooldown ---
    function requestPayeeChange(uint256 proposalId, address newTarget) external {
        if (newTarget == address(0)) revert InvalidRecipient();
        
        address currentTarget = _resolveCurrentPayee(proposalId);

        require(
            msg.sender == governor || msg.sender == owner() || (currentTarget != address(0) && msg.sender == currentTarget),
            "Unauthorized payee change request"
        );

        uint256 expiry = block.timestamp + payeeChangeCooldown;
        proposalPayees[proposalId] = PayeeRecord({
            currentTarget: currentTarget,
            pendingTarget: newTarget,
            cooldownExpiry: expiry,
            hasPendingChange: true
        });

        emit PayeeChangeRequested(proposalId, currentTarget, newTarget, expiry);
    }

    function confirmPayeeChange(uint256 proposalId) external {
        PayeeRecord storage rec = proposalPayees[proposalId];
        if (!rec.hasPendingChange) revert NoPendingPayeeChange(proposalId);
        if (block.timestamp < rec.cooldownExpiry) {
            revert CooldownNotExpired(block.timestamp, rec.cooldownExpiry);
        }

        address old = rec.currentTarget;
        rec.currentTarget = rec.pendingTarget;
        rec.pendingTarget = address(0);
        rec.hasPendingChange = false;

        emit PayeeChangeConfirmed(proposalId, old, rec.currentTarget);
    }

    function overridePayeeChange(uint256 proposalId, address newTarget) external onlyGovernorOrOwner {
        if (newTarget == address(0)) revert InvalidRecipient();
        address old = _resolveCurrentPayee(proposalId);
        proposalPayees[proposalId] = PayeeRecord({
            currentTarget: newTarget,
            pendingTarget: address(0),
            cooldownExpiry: block.timestamp,
            hasPendingChange: false
        });

        emit PayeeChangeConfirmed(proposalId, old, newTarget);
    }

    // --- Human Review Gate for Model Verdicts ---
    function approveReleaseHuman(bytes32 releaseKey) external {
        require(isAuthorizedReviewer(msg.sender), "Only governor, owner, or authorized reviewer can approve");
        humanApproved[releaseKey] = true;
        emit HumanApprovalGranted(releaseKey, msg.sender);
    }

    function getReleaseAuthorization(
        address caller,
        uint256 amount,
        bytes32 releaseKey
    ) external view returns (
        bool canReleaseDirectly,
        bool requiresHumanApproval,
        string memory releaseRole
    ) {
        bool isHuman = isAuthorizedReviewer(caller);
        bool isAgent = isAuthorizedAgent(caller);
        bool isApproved = humanApproved[releaseKey];
        bool overCap = (amount > humanReviewThreshold);

        if (overCap && !isApproved && !isHuman) {
            return (false, true, isAgent ? "AGENT_STOPPED_AT_CAP" : "HUMAN_APPROVAL_REQUIRED");
        }

        string memory role = isHuman ? "HUMAN_OPERATOR" : (isAgent ? "AUTONOMOUS_AGENT" : "BENEFICIARY");
        return (true, overCap && !isApproved, role);
    }

    // --- Storage Push Helpers to prevent bytecode bloat ---
    function _addTransaction(
        string memory txType,
        address party,
        uint256 amount,
        string memory tokenSymbol,
        string memory description,
        string memory deliverableURI
    ) internal {
        transactions.push(Transaction({
            txType: txType,
            party: party,
            amount: amount,
            tokenSymbol: tokenSymbol,
            description: description,
            timestamp: block.timestamp,
            deliverableURI: deliverableURI
        }));
    }

    function _queueWithdrawal(
        address recipient,
        uint256 amount,
        address token,
        string memory tokenSymbol,
        string memory description,
        string memory deliverableURI
    ) internal {
        withdrawalCount++;
        queuedWithdrawals[withdrawalCount] = QueuedWithdrawal({
            id: withdrawalCount,
            recipient: recipient,
            amount: amount,
            token: token,
            tokenSymbol: tokenSymbol,
            description: description,
            executionTime: block.timestamp + withdrawalDelay,
            executed: false,
            canceled: false,
            deliverableURI: deliverableURI
        });
        emit WithdrawalQueued(withdrawalCount, recipient, amount, token, tokenSymbol, block.timestamp + withdrawalDelay);
    }

    function _recordReleaseEntry(
        bytes32 releaseKey,
        uint256 proposalId,
        uint256 milestoneId,
        bytes32 documentHash,
        bytes32 invoiceHash,
        address recipient,
        uint256 amount
    ) internal {
        ReleaseEntry memory entry = ReleaseEntry({
            proposalId: proposalId,
            milestoneId: milestoneId,
            documentHash: documentHash,
            invoiceHash: invoiceHash,
            recipient: recipient,
            amount: amount,
            timestamp: block.timestamp,
            executed: true
        });
        releaseEntries[releaseKey] = entry;
        allReleaseEntries.push(entry);
    }

    // --- Deposits ---
    function depositUSDC(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        IERC20(usdcToken).safeTransferFrom(msg.sender, address(this), amount);
        usdcBalance += amount;
        
        _addTransaction("Inflow", msg.sender, amount, "USDC", "USDC Deposit", "");
        emit DepositUSDC(msg.sender, amount, block.timestamp);
        emit Inflow(msg.sender, amount, "USDC", "USDC Deposit", block.timestamp);
    }

    function depositEURC(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        IERC20(eurcToken).safeTransferFrom(msg.sender, address(this), amount);
        eurcBalance += amount;
        
        _addTransaction("Inflow", msg.sender, amount, "EURC", "EURC Deposit", "");
        emit DepositEURC(msg.sender, amount, block.timestamp);
        emit Inflow(msg.sender, amount, "EURC", "EURC Deposit", block.timestamp);
    }

    // --- INTERNAL THREE-WAY MATCH VALIDATION ENGINE ---
    struct ValidationContext {
        bytes32 releaseKey;
        address orderRecipient;
        uint256 orderAmount;
        bytes32 orderDocHash;
        string deliverableURI;
        address effectivePayee;
        bool isDuplicate;
        bool orderFound;
        bool payeeCooldown;
        bool payeeMatched;
        bool receiptMatched;
        bool amountMatched;
        bool confidenceOk;
        bool humanRequired;
        bool balanceOk;
    }

    function _evaluateMatch(
        uint256 proposalId,
        uint256 milestoneId,
        bytes32 documentHash,
        bytes32 invoiceHash,
        address recipient,
        uint256 amount,
        uint8 aiConfidenceScore
    ) internal view returns (ValidationContext memory ctx) {
        ctx.releaseKey = keccak256(abi.encodePacked(proposalId, milestoneId, invoiceHash));

        // 1. Idempotency Check
        if (executedReleases[ctx.releaseKey] || (proposalId > 0 && proposalReleased[proposalId])) {
            ctx.isDuplicate = true;
            return ctx;
        }

        // 2. Order Lookup
        bytes32 orderKey = keccak256(abi.encodePacked(proposalId, milestoneId));
        if (registeredOrders[orderKey].exists) {
            OrderTerms storage term = registeredOrders[orderKey];
            ctx.orderRecipient = term.recipient;
            ctx.orderAmount = term.amount;
            ctx.orderDocHash = term.expectedDocumentHash;
            ctx.deliverableURI = term.deliverableURI;
            ctx.orderFound = true;
        } else if (proposalId > 0 && governor != address(0)) {
            try ISynArcGovernor(governor).getProposalExecutionData(proposalId) returns (
                address target, uint256 impact, bytes32 dHash, string memory uri, ISynArcGovernor.ProposalState pState
            ) {
                if (pState == ISynArcGovernor.ProposalState.Succeeded || pState == ISynArcGovernor.ProposalState.Executed) {
                    ctx.orderRecipient = target;
                    ctx.orderAmount = impact;
                    ctx.orderDocHash = dHash;
                    ctx.deliverableURI = uri;
                    ctx.orderFound = true;
                }
            } catch {}
        }

        if (!ctx.orderFound) {
            return ctx;
        }

        // 3. Payee & Cooldown Check
        ctx.effectivePayee = ctx.orderRecipient;
        PayeeRecord storage pRec = proposalPayees[proposalId];
        if (pRec.hasPendingChange) {
            if (block.timestamp < pRec.cooldownExpiry) {
                ctx.payeeCooldown = true;
            } else {
                ctx.effectivePayee = pRec.pendingTarget;
            }
        } else if (pRec.currentTarget != address(0)) {
            ctx.effectivePayee = pRec.currentTarget;
        }

        ctx.payeeMatched = (recipient == ctx.effectivePayee && recipient != address(0));

        // 4. Receipt (Deliverable Hash) Check
        ctx.receiptMatched = (documentHash != bytes32(0) && (ctx.orderDocHash == bytes32(0) || documentHash == ctx.orderDocHash));

        // 5. Amount Check (Exact Match)
        ctx.amountMatched = (amount > 0 && amount == ctx.orderAmount);

        // 6. AI Confidence Check
        ctx.confidenceOk = (aiConfidenceScore >= minConfidenceScore);

        // 7. Human Review Requirement
        ctx.humanRequired = (amount > humanReviewThreshold && !humanApproved[ctx.releaseKey]);

        // 8. Liquidity Check
        ctx.balanceOk = (usdcBalance >= amount);
    }

    // --- DRY-RUN SIMULATION PATH (Ghostfolio pattern: duplicate signal & dry run before commit) ---
    function simulateRelease(
        uint256 proposalId,
        uint256 milestoneId,
        bytes32 documentHash,
        bytes32 invoiceHash,
        address recipient,
        uint256 amount,
        uint8 aiConfidenceScore
    ) external view returns (SimulationResult memory res) {
        ValidationContext memory ctx = _evaluateMatch(proposalId, milestoneId, documentHash, invoiceHash, recipient, amount, aiConfidenceScore);

        res.isDuplicate = ctx.isDuplicate;
        res.orderMatches = ctx.orderFound;
        res.receiptMatches = ctx.receiptMatched;
        res.invoiceMatches = ctx.amountMatched;
        res.payeeMatches = ctx.payeeMatched;
        res.payeeCooldownActive = ctx.payeeCooldown;
        res.requiresHumanApproval = ctx.humanRequired;
        res.sufficientBalance = (usdcBalance >= amount);

        if (ctx.isDuplicate) {
            res.statusMessage = "DUPLICATE_RELEASE";
            res.returnCode = 409;
        } else if (!ctx.orderFound) {
            res.statusMessage = "ORDER_NOT_FOUND_OR_NOT_SUCCEEDED";
            res.returnCode = 404;
        } else if (ctx.payeeCooldown) {
            res.statusMessage = "PAYEE_COOLDOWN_ACTIVE";
            res.returnCode = 423;
        } else if (!ctx.payeeMatched) {
            res.statusMessage = "PAYEE_MISMATCH";
            res.returnCode = 403;
        } else if (!ctx.receiptMatched) {
            res.statusMessage = "RECEIPT_DOCUMENT_HASH_MISMATCH";
            res.returnCode = 422;
        } else if (!ctx.amountMatched) {
            res.statusMessage = "AMOUNT_MISMATCH";
            res.returnCode = 400;
        } else if (!ctx.confidenceOk) {
            res.statusMessage = "LOW_CONFIDENCE_SCORE";
            res.returnCode = 412;
        } else if (!ctx.balanceOk) {
            res.statusMessage = "INSUFFICIENT_TREASURY_BALANCE";
            res.returnCode = 402;
        } else if (ctx.humanRequired) {
            res.statusMessage = "HUMAN_APPROVAL_REQUIRED";
            res.returnCode = 201;
        } else {
            res.canRelease = true;
            res.statusMessage = "READY_FOR_RELEASE";
            res.returnCode = 200;
        }
    }

    // --- CONTRACT-LEVEL THREE-WAY MATCH RELEASE (Order, Receipt, Invoice) ---
    function releaseMilestone(
        uint256 proposalId,
        uint256 milestoneId,
        bytes32 documentHash,
        bytes32 invoiceHash,
        address recipient,
        uint256 amount,
        uint8 aiConfidenceScore
    ) public nonReentrant whenNotPaused {
        if (recipient == address(0)) revert InvalidRecipient();
        if (amount == 0) revert InvalidAmount();

        ValidationContext memory ctx = _evaluateMatch(proposalId, milestoneId, documentHash, invoiceHash, recipient, amount, aiConfidenceScore);

        if (ctx.isDuplicate) revert DuplicateRelease(ctx.releaseKey);
        if (!ctx.orderFound) revert OrderNotFound(proposalId, milestoneId);
        if (ctx.payeeCooldown) revert PayeeCooldownActive(proposalPayees[proposalId].pendingTarget, proposalPayees[proposalId].cooldownExpiry);
        if (!ctx.payeeMatched) revert PayeeMismatch(ctx.effectivePayee, recipient);
        if (!ctx.receiptMatched) revert DocumentReceiptMismatch(ctx.orderDocHash, documentHash);
        if (!ctx.amountMatched) revert AmountMismatch(ctx.orderAmount, amount);
        if (!ctx.confidenceOk) revert LowConfidenceScore(aiConfidenceScore, minConfidenceScore);

        bool isHumanReviewer = isAuthorizedReviewer(msg.sender);
        if (ctx.humanRequired && !isHumanReviewer) {
            revert HumanApprovalRequired(ctx.releaseKey, amount, humanReviewThreshold);
        }
        if (!ctx.balanceOk) revert InsufficientTreasuryBalance(usdcBalance, amount);

        // State mutations
        executedReleases[ctx.releaseKey] = true;
        if (proposalId > 0) {
            proposalReleased[proposalId] = true;
        }
        usdcBalance -= amount;

        _recordReleaseEntry(ctx.releaseKey, proposalId, milestoneId, documentHash, invoiceHash, recipient, amount);
        _addTransaction("Outflow", recipient, amount, "USDC", "Three-way match verified milestone release", ctx.deliverableURI);

        IERC20(usdcToken).safeTransfer(recipient, amount);

        emit ThreeWayMatchSuccess(
            ctx.releaseKey,
            proposalId,
            milestoneId,
            documentHash,
            invoiceHash,
            recipient,
            amount
        );
        emit Outflow(
            recipient,
            amount,
            "USDC",
            "Three-way match verified milestone release",
            block.timestamp,
            ctx.deliverableURI
        );
    }

    // --- Governed withdrawal with proposal idempotency guard and deliverable attestation ---
    function withdraw(
        uint256 proposalId,
        address recipient,
        uint256 amount,
        string memory deliverableURI
    ) public onlyGovernor nonReentrant whenNotPaused {
        _withdrawInternal(proposalId, recipient, amount, deliverableURI);
    }

    // Legacy withdrawal compatibility for Governor contract calls
    function withdraw(address recipient, uint256 amount) external onlyGovernor nonReentrant whenNotPaused {
        _withdrawInternal(0, recipient, amount, "ipfs://QmPgvwkpDNgHSTx3V7NrLwCrQbppN39Zpji6o3TwbtVuiU");
    }

    function _withdrawInternal(
        uint256 proposalId,
        address recipient,
        uint256 amount,
        string memory deliverableURI
    ) internal {
        require(amount > 0, "Amount must be greater than 0");
        if (proposalId > 0) {
            require(!proposalReleased[proposalId], "Treasury: duplicate execution prevented by idempotency guard");
            proposalReleased[proposalId] = true;
        }

        address effectiveRecipient = recipient;
        PayeeRecord storage pRecord = proposalPayees[proposalId];
        if (pRecord.hasPendingChange) {
            if (block.timestamp < pRecord.cooldownExpiry) {
                revert PayeeCooldownActive(pRecord.pendingTarget, pRecord.cooldownExpiry);
            } else {
                effectiveRecipient = pRecord.pendingTarget;
            }
        } else if (pRecord.currentTarget != address(0)) {
            effectiveRecipient = pRecord.currentTarget;
        }

        require(usdcBalance >= amount, "Insufficient USDC balance");
        usdcBalance -= amount;

        bytes32 docHash = bytes(deliverableURI).length > 0 ? keccak256(bytes(deliverableURI)) : keccak256(abi.encodePacked("PROPOSAL_DOC_", proposalId));
        bytes32 invHash = keccak256(abi.encodePacked("GOV_RELEASE_", proposalId, block.timestamp));
        bytes32 releaseKey = keccak256(abi.encodePacked(proposalId, uint256(0), invHash));
        executedReleases[releaseKey] = true;

        _recordReleaseEntry(releaseKey, proposalId, 0, docHash, invHash, effectiveRecipient, amount);
        
        if (effectiveRecipient == agentAddress || effectiveRecipient == owner()) {
            IERC20(usdcToken).safeTransfer(effectiveRecipient, amount);
            _addTransaction("Outflow", effectiveRecipient, amount, "USDC", "Governance approved instant withdraw", deliverableURI);
            emit Outflow(effectiveRecipient, amount, "USDC", "Governance approved instant withdraw", block.timestamp, deliverableURI);
        } else {
            _queueWithdrawal(effectiveRecipient, amount, usdcToken, "USDC", "Governance approved withdraw with attestation", deliverableURI);
        }
    }

    // Withdrawal queueing functions (governor only, subject to timelock)
    function withdrawUSDC(address recipient, uint256 amount) external onlyGovernor nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(usdcBalance >= amount, "Insufficient USDC balance");
        usdcBalance -= amount;
        _queueWithdrawal(recipient, amount, usdcToken, "USDC", "Governance approved USDC withdraw", "ipfs://QmPgvwkpDNgHSTx3V7NrLwCrQbppN39Zpji6o3TwbtVuiU");
    }

    function withdrawEURC(address recipient, uint256 amount) external onlyGovernor nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(eurcBalance >= amount, "Insufficient EURC balance");
        eurcBalance -= amount;
        _queueWithdrawal(recipient, amount, eurcToken, "EURC", "Governance approved EURC withdraw", "ipfs://QmPgvwkpDNgHSTx3V7NrLwCrQbppN39Zpji6o3TwbtVuiU");
    }

    // Execute a queued withdrawal after the delay
    function executeWithdrawal(uint256 id) external nonReentrant whenNotPaused {
        require(id > 0 && id <= withdrawalCount, "Invalid withdrawal ID");
        QueuedWithdrawal storage q = queuedWithdrawals[id];
        require(!q.executed, "Already executed");
        require(!q.canceled, "Canceled");
        require(block.timestamp >= q.executionTime, "Timelock not expired");

        q.executed = true;
        IERC20(q.token).safeTransfer(q.recipient, q.amount);

        _addTransaction("Outflow", q.recipient, q.amount, q.tokenSymbol, q.description, q.deliverableURI);
        
        if (q.token == usdcToken) {
            emit WithdrawalUSDC(q.recipient, q.amount, block.timestamp);
        } else if (q.token == eurcToken) {
            emit WithdrawalEURC(q.recipient, q.amount, block.timestamp);
        }
        
        emit Outflow(q.recipient, q.amount, q.tokenSymbol, q.description, block.timestamp, q.deliverableURI);
        emit WithdrawalExecuted(id, q.recipient, q.amount, q.token);
    }

    // Cancel a queued withdrawal (emergency action by governor or owner)
    function cancelWithdrawal(uint256 id) external onlyGovernorOrOwner nonReentrant {
        require(id > 0 && id <= withdrawalCount, "Invalid withdrawal ID");
        QueuedWithdrawal storage q = queuedWithdrawals[id];
        require(!q.executed, "Already executed");
        require(!q.canceled, "Already canceled");

        q.canceled = true;
        
        if (q.token == usdcToken) {
            usdcBalance += q.amount;
        } else if (q.token == eurcToken) {
            eurcBalance += q.amount;
        }

        emit WithdrawalCanceled(id);
    }

    function syncBalance() external nonReentrant whenNotPaused {
        uint256 actualUsdc = IERC20(usdcToken).balanceOf(address(this));
        if (actualUsdc > usdcBalance) {
            emit Inflow(msg.sender, actualUsdc - usdcBalance, "USDC", "Direct transfer sync", block.timestamp);
            usdcBalance = actualUsdc;
        }
        uint256 actualEurc = IERC20(eurcToken).balanceOf(address(this));
        if (actualEurc > eurcBalance) {
            emit Inflow(msg.sender, actualEurc - eurcBalance, "EURC", "Direct transfer sync", block.timestamp);
            eurcBalance = actualEurc;
        }
    }

    function balance() external view returns (uint256) {
        return IERC20(usdcToken).balanceOf(address(this));
    }

    function tokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    function getTransactions() external view returns (Transaction[] memory) {
        return transactions;
    }

    function getQueuedWithdrawals() external view returns (QueuedWithdrawal[] memory) {
        QueuedWithdrawal[] memory list = new QueuedWithdrawal[](withdrawalCount);
        for (uint256 i = 1; i <= withdrawalCount; i++) {
            list[i - 1] = queuedWithdrawals[i];
        }
        return list;
    }

    function getAllReleaseEntries() external view returns (ReleaseEntry[] memory) {
        return allReleaseEntries;
    }

    function getReleaseEntry(bytes32 releaseKey) external view returns (ReleaseEntry memory) {
        return releaseEntries[releaseKey];
    }
}
