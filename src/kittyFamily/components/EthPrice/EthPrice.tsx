// @ts-nocheck
import React from 'react'
import loading from 'kittyFamily/svg/loading.svg'
import './ethPrice.css'

const EthPrice = ({ ethPrice }) =>
  <h3 className={'ethprice'}>Ξ1 {(!ethPrice) ? <img src={loading} alt={''} /> : <span>/ ${ethPrice.USD} / £{ethPrice.GBP} / €{ethPrice.EUR}</span>}</h3>

export default EthPrice
