import { useState, useEffect } from 'react'
import axios from 'axios'
import * as Styled from './EthPrice.style'

const endpoint = `https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD,GBP,EUR`

const EthPrice = () => {
    const [ethPrice, setEthPrice] = useState<any | undefined>(undefined)
    useEffect(() => {
        const getEthPrice = async () => {
            try {
                const { data } = await axios.get(endpoint)
                setEthPrice(data)
            } catch (e) {
                console.log(e)
            }
        }
        getEthPrice()
    }, [])
  return (
      <Styled.Div>
          {'Ξ1 '}{(!ethPrice)
              ? <img src={'/images/loading.svg'} alt={''} />
              : <span>/ ${ethPrice.USD} / £{ethPrice.GBP} / €{ethPrice.EUR}</span>
          }
      </Styled.Div>
  )
}

export default EthPrice
