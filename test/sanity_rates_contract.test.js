import assert from 'assert'
import ganache from 'ganache-cli'

import SanityRatesContract from '../src/sanity_rates_contract'
import Deployer, { KyberNetworkAddress } from '../src/deployer'
import { default as ERC20TokenDeployer } from './deploy_erc20'
import { assertThrowAsync } from './test_util'
const provider = ganache.provider()

let addresses
beforeEach(async () => {
  const dpl = new Deployer(provider)
  addresses = await dpl.deploy(
    { address: (await dpl.web3.eth.getAccounts())[0] },
    KyberNetworkAddress,
    true
  )
})

describe('SanityRatesContract', () => {
  it('failed to create an instance if provider is not provided', () => {
    assert.throws(() => {
      SanityRatesContract(undefined, addresses.reserve)
    })
  })

  it('failed to create an instance if address is invalid', () => {
    assert.throws(() => {
      SanityRatesContract(provider, '')
    })
    assert.throws(() => {
      SanityRatesContract(provider, 'invalid-address')
    })
  })

  it('created an reserve contract instance successfully', () => {
    const sanityRatesContract = new SanityRatesContract(
      provider,
      addresses.sanityRates
    )
    assert.ok(sanityRatesContract.contract)
  })

  it('set sanity rates successfully', async () => {
    const TestRate = 1000
    console.log('testing set sanity rates...')
    const sanityRatesContract = new SanityRatesContract(
      provider,
      addresses.sanityRates
    )
    const accounts = await sanityRatesContract.web3.eth.getAccounts()
    const tokenAddr = await ERC20TokenDeployer(provider)
    // must not be able to set sanity Rate from non operator account
    await assertThrowAsync(async () =>
      sanityRatesContract.setSanityRates(
        { address: accounts[1] },
        [tokenAddr],
        [TestRate]
      )
    )

    // add operator and the set rate should be successful
    assert.ok(
      await sanityRatesContract.addOperator(
        { address: accounts[0] },
        accounts[0]
      )
    )
    assert.ok(
      await sanityRatesContract.setSanityRates(
        { address: accounts[0] },
        [tokenAddr],
        [TestRate]
      )
    )
    const rate = await sanityRatesContract.getSanityRate(
      tokenAddr,
      '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
    )
    assert.strictEqual(rate, TestRate.toString())
  })

  it('set reasonableDiffInBps rates successfully', async () => {
    const testDiff = 100
    console.log('testing set reasonableDiffInBps rates...')
    const sanityRatesContract = new SanityRatesContract(
      provider,
      addresses.sanityRates
    )
    const accounts = await sanityRatesContract.web3.eth.getAccounts()
    const tokenAddr = await ERC20TokenDeployer(provider)
    assert.ok(
      await sanityRatesContract.setReasonableDiff(
        { address: accounts[0] },
        [tokenAddr],
        [testDiff]
      )
    )
    const diff = await sanityRatesContract.reasonableDiffInBps(tokenAddr)
    assert.strictEqual(diff, testDiff.toString())
  })
})
