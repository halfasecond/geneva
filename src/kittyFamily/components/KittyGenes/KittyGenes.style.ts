// @ts-nocheck
import styled from 'styled-components'
import { breaks, colors, colorsAlternate, colorsAlternate3, colorsAlternate4, grey } from 'kittyFamily/style/config'
import { color, fonts, space, typeCss } from 'kittyUi/tokens'
import mewtationDiamond from 'kittyFamily/svg/genes/mewtation-diamond.svg'
import mewtationGold from 'kittyFamily/svg/genes/mewtation-gold.svg'
import mewtationSilver from 'kittyFamily/svg/genes/mewtation-silver.svg'
import mewtationBronze from 'kittyFamily/svg/genes/mewtation-bronze.svg'
import jewelDiamond from 'kittyFamily/svg/genes/jewel-diamond.svg'
import jewelGold from 'kittyFamily/svg/genes/jewel-gold.svg'
import jewelSilver from 'kittyFamily/svg/genes/jewel-silver.svg'
import jewelBronze from 'kittyFamily/svg/genes/jewel-bronze.svg'

const mewtationIcons = {
  diamond: mewtationDiamond,
  gold: mewtationGold,
  silver: mewtationSilver,
  bronze: mewtationBronze,
}

const jewelIcons = {
  diamond: jewelDiamond,
  gold: jewelGold,
  silver: jewelSilver,
  bronze: jewelBronze,
}

const chipWash = {
  diamond: { background: colorsAlternate4.bubblegum, border: colorsAlternate3.bubblegum },
  gold: { background: colorsAlternate4.gold, border: colorsAlternate3.gold },
  silver: { background: colorsAlternate4.violet, border: colorsAlternate3.violet },
  bronze: { background: colorsAlternate4.sapphire, border: colorsAlternate3.sapphire },
  none: { background: color.wash, border: color.line },
}

export const Div = styled.div`
  margin: 0;
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  overflow-x: hidden;
  box-sizing: border-box;
  ${typeCss('caption')}
`

export const HelixContainer = styled.div`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  margin: 0 0 ${space.md};
  @media (min-width: ${breaks['md']}) {
    width: calc(50% - ${space.xs});
  }
`

export const Helix = styled.div`
  display: flex;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  flex-wrap: wrap;
  text-align: center;
  border: 1px solid ${({ pureBred }) => (pureBred ? colors.pink : grey[300])};
  border-radius: 6px;
  overflow: hidden;
  && > label {
    flex: 0 0 100%;
    width: 100%;
    color: ${grey[800]};
    background-color: ${grey[100]};
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    ${typeCss('caption')}
    font-weight: 600;
    padding: ${space.xs} 0;
    > b {
      text-transform: uppercase;
      font-weight: 700;
      font-family: ${fonts.body};
      font-size: 13px;
      letter-spacing: 0.02em;
    }
    > span.binary {
      display: none;
    }
    > img {
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }
  }
`

export const Gene = styled.div`
  --kaleidoscopeLoopDuration: 4s;
  flex: 0 0 25%;
  width: 25%;
  aspect-ratio: 2.2 / 1;
  @media (min-width: ${breaks['md']}) {
    aspect-ratio: 1 / 1;
  }
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${fonts.body};
  font-size: 12px;
  font-weight: 700;
  color: ${grey[700]};
  position: relative;
  cursor: default;
  box-sizing: border-box;
  && {
    font-weight: 700;
  }
  &.--color-kaleidoscope {
    animation: kaleidoscopeBg var(--kaleidoscopeLoopDuration) linear infinite;
    will-change: background-color;
  }
  > div {
    position: absolute;
    width: 50%;
    height: 100%;
    z-index: 0;
    &:first-of-type {
      left: 0;
    }
    &:last-of-type {
      left: 50%;
    }
  }
  && > span {
    z-index: 1;
    font-weight: 700;
    font-family: ${fonts.body};
    font-size: 12px;
    color: ${grey[700]};
  }

  @keyframes kaleidoscopeBg {
    0% { background-color: ${colorsAlternate.strawberry}; }
    20% { background-color: ${colorsAlternate.pumpkin}; }
    40% { background-color: ${colorsAlternate.gold}; }
    60% { background-color: ${colorsAlternate.limegreen}; }
    80% { background-color: ${colorsAlternate.cyan}; }
    100% { background-color: ${colorsAlternate.strawberry}; }
  }
`

export const Chip = styled.div`
  display: inline-flex;
  align-items: center;
  overflow: hidden;
  max-width: 100%;
  margin: ${space.xs} 0 0;
  ${({ $kind, $rank }) => {
    const wash = chipWash[$rank] || chipWash.none
    if ($kind === 'mewtation') {
      const ring = $rank === 'none'
        ? `inset 0 0 0 2px ${wash.border}`
        : `inset 0 0 0 2px ${wash.border}, inset 0 0 0 4px #fff`
      return `
        position: relative;
        padding: 0 10px 0 6px;
        height: 36px;
        min-width: 0;
        border-radius: 18px;
        background-color: ${wash.background};
        box-shadow: ${ring};
      `
    }
    return `
      padding: 0;
      height: auto;
    `
  }}
`

export const ChipIcon = styled.div`
  flex: 0 0 ${({ $kind }) => ($kind === 'mewtation' ? '28px' : '28px')};
  width: ${({ $kind }) => ($kind === 'mewtation' ? '28px' : '28px')};
  height: ${({ $kind }) => ($kind === 'mewtation' ? '28px' : '28px')};
  margin-right: 6px;
  background-image: ${({ $kind, $rank }) => {
    if ($rank === 'none') return 'none'
    const src = $kind === 'mewtation' ? mewtationIcons[$rank] : jewelIcons[$rank]
    return src ? `url('${src}')` : 'none'
  }};
  background-size: ${({ $kind }) => ($kind === 'mewtation' ? '28px 28px' : '16px 16px')};
  background-repeat: no-repeat;
  background-position: center;
  ${({ $kind, $rank }) => {
    if ($kind !== 'jewel') return ''
    const wash = chipWash[$rank] || chipWash.none
    const ring = $rank === 'none'
      ? `inset 0 0 0 2px ${wash.border}`
      : `inset 0 0 0 2px ${wash.border}, inset 0 0 0 4px #fff`
    return `
      border-radius: 50%;
      background-color: ${wash.background};
      box-shadow: ${ring};
    `
  }}
`

export const ChipCopy = styled.div`
  position: relative;
  overflow: hidden;
  min-width: 0;
  > .title,
  > .type {
    display: block;
    margin: 0;
    padding: 0;
    font-family: ${fonts.body};
    font-weight: 400;
    text-transform: lowercase;
    line-height: 1.15;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  > .title {
    color: ${grey[900]};
    font-size: 12px;
    font-weight: 700;
  }
  > .type {
    color: ${grey[500]};
    font-size: 10px;
  }
`
