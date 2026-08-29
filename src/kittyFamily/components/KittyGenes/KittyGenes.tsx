// @ts-nocheck
import { useState } from 'react'
import { catTypes, genes } from 'kittyFamily/utils'
import * as Styled from './KittyGenes.style'
import dna from 'kittyFamily/svg/dna.svg'

const decToBinary = { decimal: (n) => BigInt(n).toString(2) }

const KittyGenes = ({ kitty, showBinaryGenes, defaultOpen }) => {
  let geneToBinary = decToBinary.decimal(kitty.genes).toString()
  const addZeros = 240 - geneToBinary.length
  for (let i = 0; i < addZeros; i ++) {
    geneToBinary = "0"+geneToBinary
  }
  const geneBlocks = [...geneToBinary.match(/.{1,5}/g).reverse()]
  return (
    <Styled.Div>
      <div>
        {geneBlocks.length === 48 && geneToBinary.length === 240 && geneBlocks.map((gB, i) => i % 4 === 0 && (
          <div key={i}>
            <b>{genes.find(g => g.binary === gB)[catTypes[(i / 4)].param]
              ? genes.find(g => g.binary === gB)[catTypes[(i / 4)].param]
              : '-'
            }</b>
            {catTypes[(i / 4)].readable}
            <div>
              <div style={{ padding: '3px 3px', backgroundColor: '#cdf5d4' }}>{genes.find(g => g.binary === gB).kai}</div>
              <div style={{ padding: '3px 3px', backgroundColor: '#ddc4ff' }}>{genes.find(g => g.binary === geneBlocks[i + 1]).kai}</div>
              <div style={{ padding: '3px 3px', backgroundColor: '#ede2f5' }}>{genes.find(g => g.binary === geneBlocks[i + 2]).kai}</div>
              <div style={{ padding: '3px 3px', backgroundColor: '#f6f1fa' }}>{genes.find(g => g.binary === geneBlocks[i + 3]).kai}</div>
            </div>
            {showBinaryGenes &&
              <div>
                <div style={{ padding: '3px 3px', backgroundColor: '#cdf5d4' }}>{gB}</div>
                <div style={{ padding: '3px 3px', backgroundColor: '#ddc4ff' }}>{geneBlocks[i + 1]}</div>
                <div style={{ padding: '3px 3px', backgroundColor: '#ede2f5' }}>{geneBlocks[i + 2]}</div>
                <div style={{ padding: '3px 3px', backgroundColor: '#f6f1fa' }}>{geneBlocks[i + 3]}</div>
              </div>
            }
          </div>
        ))}
      </div>
    </Styled.Div>
  )
}


export default KittyGenes
