const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContract("FundMe", deployer)
    console.log(`Got contract FundMe at ${fundMe.address}`)
    console.log("Withdrawing from contract...")

    const startingFundMeBalasnce = await ethers.provider.getBalance(
        fundMe.target,
    )

    const transactionResponse = await fundMe.withdraw()
    const transactionReceipt = await transactionResponse.wait(1)
    const { gasPrice, gasUsed } = transactionReceipt
    const gasCost = gasUsed * gasPrice

    console.log(
        `Got it back in the amount of ${startingFundMeBalasnce - gasCost} wei`,
    )
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
