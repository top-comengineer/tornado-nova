const { ethers } = require('hardhat')
const { utils } = ethers
// const prompt = require('prompt-sync')()

const MERKLE_TREE_HEIGHT = 23
const { MINIMUM_WITHDRAWAL_AMOUNT, MAXIMUM_DEPOSIT_AMOUNT } = process.env

async function main() {
  require('./compileHasher')
  const govAddress = '0xBAE5aBfa98466Dbe68836763B087f2d189f4D28f'
  const omniBridge = '0x59447362798334d3485c64D1e4870Fde2DDC0d75'
  const amb = '0x162e898bd0aacb578c8d5f8d6ca588c13d2a383f'
  const token = '0xCa8d20f3e0144a72C6B5d576e9Bd3Fd8557E2B04' // WBNB
  const l1Unwrapper = '0x8845F740F8B01bC7D9A4C82a6fD4A60320c07AF1' // WBNB -> BNB
  const l1ChainId = 56
  const multisig = '0xE3611102E23a43136a13993E3a00BAD67da19119'

  const Verifier2 = await ethers.getContractFactory('Verifier2')
  const verifier2 = await Verifier2.deploy()
  await verifier2.deployed()
  console.log(`verifier2: ${verifier2.address}`)

  const Verifier16 = await ethers.getContractFactory('Verifier16')
  const verifier16 = await Verifier16.deploy()
  await verifier16.deployed()
  console.log(`verifier16: ${verifier16.address}`)

  const Hasher = await await ethers.getContractFactory('Hasher')
  const hasher = await Hasher.deploy()
  await hasher.deployed()
  console.log(`hasher: ${hasher.address}`)

  const Pool = await ethers.getContractFactory('TornadoPool')
  console.log(
    `constructor args:\n${JSON.stringify([
      verifier2.address,
      verifier16.address,
      MERKLE_TREE_HEIGHT,
      hasher.address,
      token,
      omniBridge,
      l1Unwrapper,
      govAddress,
      l1ChainId,
      multisig,
    ]).slice(1, -1)}\n`,
  )

  //const tornadoImpl = prompt('Deploy tornado pool implementation and provide address here:\n')
  const tornadoImpl = await Pool.deploy(
    verifier2.address,
    verifier16.address,
    MERKLE_TREE_HEIGHT,
    hasher.address,
    token,
    omniBridge,
    l1Unwrapper,
    govAddress,
    l1ChainId,
    multisig,
  )
  await tornadoImpl.deployed()
  console.log(`TornadoPool implementation address: ${tornadoImpl.address}`)

  const CrossChainUpgradeableProxy = await ethers.getContractFactory('CrossChainUpgradeableProxy')
  const proxy = await CrossChainUpgradeableProxy.deploy(tornadoImpl.address, govAddress, [], amb, l1ChainId)
  await proxy.deployed()
  console.log(`proxy address: ${proxy.address}`)

  const tornadoPool = await Pool.attach(proxy.address)

  await tornadoPool.initialize(
    utils.parseEther(MINIMUM_WITHDRAWAL_AMOUNT),
    utils.parseEther(MAXIMUM_DEPOSIT_AMOUNT),
  )
  console.log(
    `Proxy initialized with MINIMUM_WITHDRAWAL_AMOUNT=${MINIMUM_WITHDRAWAL_AMOUNT} ETH and MAXIMUM_DEPOSIT_AMOUNT=${MAXIMUM_DEPOSIT_AMOUNT} ETH`,
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
