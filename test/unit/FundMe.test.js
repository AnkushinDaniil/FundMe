const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")

describe("FundMe", async () => {
    let fundMe
    let deployer
    let mockV3Aggregator
    const exampleValue = ethers.parseEther("1.0")
    beforeEach(async () => {
        // const accounts = await ethers.getSigners()
        // const accountZero = accounts[0]
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        )
    })
    describe("constructor", async () => {
        it("sets the aggregatoe address correctly", async () => {
            const response = await fundMe.s_priceFeed
            assert.equal(response, mockV3Aggregator.address)
        })
    })
    describe("fund", async () => {
        it("Fails if you don't send enough ETH", async () => {
            await expect(fundMe.fund()).to.be.revertedWithCustomError(
                fundMe,
                "FundMe__InsufficientFunding"
            )
        })
        it("Updated the amount funded data structure", async () => {
            await fundMe.fund({ value: exampleValue })
            const responce = await fundMe.addressToAmountFunded(deployer)
            assert.equal(responce, exampleValue)
        })
        it("Adds funders to array of funders", async () => {
            await fundMe.fund({ value: exampleValue })
            const funder = await fundMe.funders(0)
            assert.equal(funder, deployer)
        })
    })
    describe("withdraw", async () => {
        beforeEach(async () => {
            await fundMe.fund({ value: exampleValue })
        })
        it("withdraw ETH from a single founder", async () => {
            const startingFundMeBalasnce = await ethers.provider.getBalance(
                fundMe.target
            )
            const startingDeployerBalance = await ethers.provider.getBalance(
                deployer
            )
            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const { gasPrice, gasUsed } = transactionReceipt
            const gasCost = gasUsed * gasPrice
            const endingFundMeBalance = await ethers.provider.getBalance(
                fundMe.target
            )
            const endingDeployerBalance = await ethers.provider.getBalance(
                deployer
            )
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundMeBalasnce + startingDeployerBalance,
                endingDeployerBalance + gasCost
            )
        })
        it("Allows us to withdraw with multiple funders", async () => {
            const accounts = await ethers.getSigners()
            for (const account of accounts) {
                const fundMeConnectedContract = await fundMe.connect(account)
                await fundMeConnectedContract.fund({ value: exampleValue })
            }
            const startingFundMeBalasnce = await ethers.provider.getBalance(
                fundMe.target
            )
            const startingDeployerBalance = await ethers.provider.getBalance(
                deployer
            )
            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const { gasPrice, gasUsed } = transactionReceipt
            const gasCost = gasUsed * gasPrice
            const endingFundMeBalance = await ethers.provider.getBalance(
                fundMe.target
            )
            const endingDeployerBalance = await ethers.provider.getBalance(
                deployer
            )
            // Assert
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundMeBalasnce + startingDeployerBalance,
                endingDeployerBalance + gasCost
            )
            // Zeroing out the list of investors
            await expect(fundMe.funders(0)).to.be.reverted
            for (const account of accounts) {
                assert.equal(
                    await fundMe.addressToAmountFunded(account.address),
                    0
                )
            }
        })
    })
})
