const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")

describe("FundMe", async () => {
    let fundMe
    let deployer
    let mockV3Aggregator
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
    })
})
