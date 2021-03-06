import Web3 from 'web3'

import reserveContractABI from '../contracts/KyberReserveContract.abi'
import BaseContract from './base_contract'
import { validateAddress } from './validate'
import { assertAdmin, assertAlerter } from './permission_assert'

/**
 * ReserveContract contains extended methods for KyberReserveContract
 */
export default class ReserveContract extends BaseContract {
  /**
   * Create new BaseContract instance.
   * @param {object} provider - Web3 provider
   * @param {string} address - address of kyber reserve smart contract.
   */
  constructor (provider, address) {
    super(provider, address)
    this.web3 = new Web3(provider)
    this.contract = new this.web3.eth.Contract(reserveContractABI, address)
  }
  /**
   * enableTrade allow the reserve to continue trading
   * @param {object} account - Admin account
   * @param {number} gasPrice (optional) - the gasPrice desired for the tx
   * @return {object} - the tx object of send() command from this contract method
   */
  async enableTrade (account, gasPrice) {
    await assertAdmin(this, account.address)
    const med = this.contract.methods.enableTrade()
    return this.contract.methods.enableTrade().send({
      from: account.address,
      gas: await med.estimateGas({
        from: account.address
      }),
      gasPrice: gasPrice
    })
  }

  /**
   * disableTrade stop the reserve from trading
   * @param {object} account - Alerter account
   * @param {number} gasPrice (optional) - the gasPrice desired for the tx
   * @return {object} - the tx object of send() command from this contract method
   */
  async disableTrade (account, gasPrice) {
    await assertAlerter(this, account.address)
    const med = this.contract.methods.disableTrade()
    return med.send({
      from: account.address,
      gas: await med.estimateGas({
        from: account.address
      }),
      gasPrice: gasPrice
    })
  }

  /**
   * tradeEnabled return true if the reserve is tradeEnabled, false otherwise
   * @return {boolean} - tradeEnabled status of the reserve
   */
  tradeEnabled () {
    return this.contract.methods.tradeEnabled().call()
  }

  /**
   * set Contract addresses for reserve contract.
   * @param {object} account - admin account.
   * @param {string} network - address of kyber network smart contract.
   * @param {string} conversion - address of kyber network smart contract.
   * @param {string} sanity (optional) - address of sanity rates contract.
   * @param {number} [gasPrice=undefined] - the gasPrice desired for the tx
   * @returns {object} - the tx object of send() command from this contract method
   */
  async setContracts (
    account,
    network,
    conversion,
    sanity,
    gasPrice = undefined
  ) {
    validateAddress(network)
    validateAddress(conversion)
    await assertAdmin(this, account.address)
    if (sanity !== undefined) {
      validateAddress(sanity)
    } else {
      sanity = '0x0000000000000000000000000000000000000000'
    }

    const med = this.contract.methods.setContracts(network, conversion, sanity)
    return med.send({
      from: account.address,
      gas: await med.estimateGas({
        from: account.address
      }),
      gasPrice: gasPrice
    })
  }

  /**
   * conversionRatesContract return the address of conversion rates of this reserve
   * @return {string} - address of conversion rates contract
   */
  conversionRatesContract () {
    return this.contract.methods.conversionRatesContract().call()
  }

  /**
   * sanityRatesContract return the address of sanity rates of this reserve
   * @return {string} - address of sanity rates contract
   */
  sanityRatesContract () {
    return this.contract.methods.sanityRatesContract().call()
  }

  /**
   * kyberNetwork return the address of kyberNetwork contract of this reserve
   * @return {string} - address of kyberNetwork contract
   */
  kyberNetwork () {
    return this.contract.methods.kyberNetwork().call()
  }

  /**
   * approve withdraw address for a token on reserve.
   * @param {object} account - admin account.
   * @param {string} tokenAddress - contract address of the modifying token.
   * @param {string} withdrawAddress - address for withdrawal.
   * @param {number} [gasPrice=undefined] - the gasPrice desired for the tx
   * @returns {object} - the tx object of send() command from this contract method
   */
  async approveWithdrawAddress (
    account,
    tokenAddress,
    withdrawAddress,
    gasPrice = undefined
  ) {
    await assertAdmin(this, account.address)
    const med = this.contract.methods.approveWithdrawAddress(
      tokenAddress,
      withdrawAddress,
      true
    )
    return med.send({
      from: account.address,
      gas: await med.estimateGas({
        from: account.address
      }),
      gasPrice: gasPrice
    })
  }

  /**
   * disapprove withdraw address for a token on reserve.
   * @param {object} account - admin account.
   * @param {string} tokenAddress - contract address of the modifying token.
   * @param {string} withdrawAddress - address for withdrawal.
   * @param {number} [gasPrice=undefined] - the gasPrice desired for the tx
   * @returns {object} - the tx object of send() command from this contract method
   */
  async disapproveWithdrawAddress (
    account,
    tokenAddress,
    withdrawAddress,
    gasPrice = undefined
  ) {
    await assertAdmin(this, account.address)
    const med = this.contract.methods.approveWithdrawAddress(
      tokenAddress,
      withdrawAddress,
      false
    )
    return med.send({
      from: account.address,
      gas: await med.estimateGas({
        from: account.address
      }),
      gasPrice: gasPrice
    })
  }

  /**
   * check for approval status of a token address to a particular address
   * @param {object} address - address to withdraw the token to
   * @param {string} tokenAddress - address of the token's smart contract. Must be deployed already.
   * @returns {boolean} - true for approved, false otherwise
   */
  approvedWithdrawAddresses (address, tokenAddress) {
    const addressHash = Web3.utils.soliditySha3(tokenAddress, address)
    return this.contract.methods.approvedWithdrawAddresses(addressHash).call()
  }

  /**
   * withdraw an amount of token to specified account
   * @param {object} account - admin account.
   * @param {string} tokenAddress - address of the token's smart contract. Must be deployed already.
   * @param {object} amount - amount to withdraw (BN|String|int), must be in wei.
   * @param {string} toAddress - address for withdrawal. Must be approved already.
   * @param {number} [gasPrice=undefined] - the gasPrice desired for the tx
   * @returns {object} - the tx object of send() command from this contract method
   */
  async withdraw (
    account,
    tokenAddress,
    amount,
    toAddress,
    gasPrice = undefined
  ) {
    await assertAdmin(this, account.address)
    const med = this.contract.methods.withdraw(tokenAddress, amount, toAddress)
    return med.send({
      from: account.address,
      gas: await med.estimateGas({
        from: account.address
      }),
      gasPrice: gasPrice
    })
  }

  /**
   * Return balance of given token.
   * @param {string} token - address of token to check balance.
   * @return {number} - balance of given token
   */
  getBalance (token) {
    return this.contract.methods.getBalance(token).call()
  }
}
