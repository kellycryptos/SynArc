import { expect } from "chai";
import { ethers } from "hardhat";

describe("Agent Operating Treasury Funding and Rebalancing", function () {
  let token: any;
  let treasuryGovernance: any;
  let treasuryAgent: any;
  let governor: any;
  let agent: any;
  let mockUSDC: any;
  let mockEURC: any;

  let owner: any;
  let voter1: any;
  let voter2: any;
  let executor: any;

  const INITIAL_SUPPLY = 15000000n * 10n ** 18n;
  const EXECUTION_DELAY = 60; // 60 seconds delay for governor execution
  const WITHDRAWAL_DELAY = 86400; // 24 hours withdrawal delay for treasury

  beforeEach(async function () {
    [owner, voter1, voter2, executor] = await ethers.getSigners();

    // Deploy Mock USDC & EURC
    const MockERC20 = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockERC20.deploy();
    mockEURC = await MockERC20.deploy();

    // Deploy SynArcToken
    const SynArcToken = await ethers.getContractFactory("SynArcToken");
    token = await SynArcToken.deploy();

    // Deploy treasuryGovernance
    const SynArcTreasury = await ethers.getContractFactory("SynArcTreasury");
    treasuryGovernance = await SynArcTreasury.deploy(await mockUSDC.getAddress(), await mockEURC.getAddress());

    // Deploy treasuryAgent (operating treasury)
    treasuryAgent = await SynArcTreasury.deploy(await mockUSDC.getAddress(), await mockEURC.getAddress());

    // Deploy SynArcGovernor
    const SynArcGovernor = await ethers.getContractFactory("SynArcGovernor");
    governor = await SynArcGovernor.deploy(
      await token.getAddress(),
      await treasuryGovernance.getAddress(),
      EXECUTION_DELAY
    );

    // Set governor on treasuryGovernance
    await treasuryGovernance.setGovernor(await governor.getAddress());

    // Deploy SynArcAgent
    const SynArcAgent = await ethers.getContractFactory("SynArcAgent");
    // constructor args: _owner, _executor, _frameworkModel
    agent = await SynArcAgent.deploy(owner.address, executor.address, "Groq Llama 3.3 70B");

    // Configure treasuryAgent:
    // 1. Set agentAddress to agent contract address
    await treasuryAgent.setAgentAddress(await agent.getAddress());
    // 2. Set governor of treasuryAgent to agent contract address
    await treasuryAgent.setGovernor(await agent.getAddress());

    // Distribute token shares for voting power
    await token.transfer(voter1.address, 1000n * 10n ** 18n);
    await token.connect(voter1).delegate(voter1.address);
    await ethers.provider.send("evm_mine", []);
  });

  it("should fund the agent operating treasury through governance proposal and execute a rebalance", async function () {
    const fundingAmount = 40n * 10n ** 6n; // 40 USDC

    // Setup treasuryGovernance funds
    await mockUSDC.mint(owner.address, fundingAmount);
    await mockUSDC.approve(await treasuryGovernance.getAddress(), fundingAmount);
    await treasuryGovernance.depositUSDC(fundingAmount);

    // Verify governance treasury has USDC and agent treasury has 0 USDC
    expect(await treasuryGovernance.usdcBalance()).to.equal(fundingAmount);
    expect(await treasuryAgent.usdcBalance()).to.equal(0n);

    // 1. Submit proposal to fund the agent operating treasury
    // propose(title, description, category, votingDuration, treasuryImpactValue, executionTarget)
    const proposeTx = await governor.propose(
      "Fund Agent Treasury - 100 USDC",
      "Fund the agent operating treasury with 100 USDC",
      "Treasury Allocation",
      86400, // 1 day voting duration
      fundingAmount,
      await treasuryAgent.getAddress()
    );
    await proposeTx.wait();

    const proposalId = 1n;

    // 2. Vote FOR proposal
    await governor.connect(voter1).castVote(proposalId, 1); // 1 = For

    // 3. Fast-forward past voting duration + governor execution delay
    await ethers.provider.send("evm_increaseTime", [86400 + EXECUTION_DELAY + 10]);
    await ethers.provider.send("evm_mine", []);

    // 4. Execute proposal on Governor (this will queue withdrawal in treasuryGovernance)
    await expect(governor.execute(proposalId))
      .to.emit(governor, "ProposalExecuted")
      .to.emit(treasuryGovernance, "WithdrawalQueued");

    // Verify withdrawal is queued in treasuryGovernance with 24h timelock
    const queuedId = 1n;
    const queued = await treasuryGovernance.queuedWithdrawals(queuedId);
    expect(queued.recipient).to.equal(await treasuryAgent.getAddress());
    expect(queued.amount).to.equal(fundingAmount);
    expect(queued.executed).to.be.false;

    // Try executing withdrawal immediately (should fail due to timelock)
    await expect(treasuryGovernance.executeWithdrawal(queuedId)).to.be.revertedWith("Timelock not expired");

    // 5. Fast-forward past treasury withdrawal delay (24 hours = 86400s)
    await ethers.provider.send("evm_increaseTime", [WITHDRAWAL_DELAY + 10]);
    await ethers.provider.send("evm_mine", []);

    // 6. Execute queued withdrawal
    await expect(treasuryGovernance.executeWithdrawal(queuedId))
      .to.emit(treasuryGovernance, "WithdrawalExecuted")
      .to.emit(treasuryGovernance, "WithdrawalUSDC");

    // Sync the balance of the agent treasury
    await treasuryAgent.syncBalance();

    // 7. Verify agent operating treasury received the funds, and governance treasury is depleted
    expect(await treasuryGovernance.usdcBalance()).to.equal(0n);
    expect(await mockUSDC.balanceOf(await treasuryAgent.getAddress())).to.equal(fundingAmount);
    // Note: usdcBalance in the contract is also updated
    expect(await treasuryAgent.usdcBalance()).to.equal(fundingAmount);

    // 8. Now simulate the agent executing an autonomous rebalance (e.g. yield strategy or CCTP) using those funds.
    // First, agent contract withdraws from treasuryAgent to itself.
    // The executor EOA triggers this by calling executeYieldStrategy on the agent smart contract.
    // The data is the encoded call to treasuryAgent.withdraw(agentAddress, amount)
    const withdrawCalldata = treasuryAgent.interface.encodeFunctionData("withdraw", [
      await agent.getAddress(),
      fundingAmount
    ]);

    // executeYieldStrategy(targetContract, token, amount, data)
    // Here we call treasuryAgent as targetContract to withdraw USDC to agent
    await expect(
      agent.connect(executor).executeYieldStrategy(
        await treasuryAgent.getAddress(),
        await mockUSDC.getAddress(),
        fundingAmount,
        withdrawCalldata
      )
    )
      .to.emit(agent, "StrategyExecuted");

    // Verify agent contract now holds the USDC balance directly
    expect(await mockUSDC.balanceOf(await agent.getAddress())).to.equal(fundingAmount);
    expect(await treasuryAgent.usdcBalance()).to.equal(0n);

    // Next, the agent executes the actual strategy (e.g., CCTP bridge or yield placement)
    // We can simulate this by transferring funds to a target contract / EOA
    const targetRecipient = owner.address;
    const initialTargetBalance = await mockUSDC.balanceOf(targetRecipient);
    const bridgeCalldata = mockUSDC.interface.encodeFunctionData("transfer", [
      targetRecipient,
      fundingAmount
    ]);

    await expect(
      agent.connect(executor).executeYieldStrategy(
        await mockUSDC.getAddress(),
        await mockUSDC.getAddress(),
        fundingAmount,
        bridgeCalldata
      )
    )
      .to.emit(agent, "StrategyExecuted");

    // Verify funds successfully reached the target
    expect(await mockUSDC.balanceOf(targetRecipient)).to.equal(initialTargetBalance + fundingAmount);
    expect(await mockUSDC.balanceOf(await agent.getAddress())).to.equal(0n);
  });
});
