// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

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
