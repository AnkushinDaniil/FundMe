const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContract("FundMe", deployer)
    const exampleValue = ethers.parseEther("0.1")
    console.log(`Got contract FundMe at ${fundMe.address}`)
    console.log("Funding contract...")
    const transactionResponse = await fundMe.fund({
        value: exampleValue,
    })
    await transactionResponse.wait()
    console.log(`Проинвестировано ${exampleValue} wei`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
