const { ethers } = require('hardhat')

// This script deploys L1Helper to FOREIGN chain (mainnet)

async function main() {
  const owner = '0xBAE5aBfa98466Dbe68836763B087f2d189f4D28f'
  const omniBridge = '0xf0b456250dc9990662a6f25808cc74a6d1131ea9'
  const token = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' // WBNB

  const Helper = await ethers.getContractFactory('L1Unwrapper')
  const helper = await Helper.deploy(omniBridge, token, owner)
  await helper.deployed()
  console.log(`L1Helper address: ${helper.address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
