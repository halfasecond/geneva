// @ts-nocheck
import styled, { keyframes } from 'styled-components'
import { breaks, colorsAlternate2 } from 'kittyFamily/style/config'
import { space } from 'kittyUi/tokens'

export const Stage = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  container-type: size;
`

export const Art = styled.div`
  position: relative;
  z-index: 1;
  width: min(76%, 76cqh);
  height: auto;
  aspect-ratio: 1 / 1;
  flex: 0 0 auto;
  @media (min-width: ${breaks['md']}) {
    width: min(84%, 84cqh);
  }
  > img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    position: relative;
    z-index: 1;
    &.kitty-hat {
      position: absolute;
      left: 0;
      top: 0;
      &.dada {
        left: 0.5%;
        top: 39%;
        width: 35%;
        border-radius: 4px;
        z-index: 10000;
      }
      &.easel {
        z-index: 9999;
      }
      &.cucumber {
        z-index: 10;
      }
    }
  }
  &.shadow:before {
    position: absolute;
    top: 72.5%;
    left: -3%;
    right: 0;
    width: 60%;
    height: 7%;
    margin: auto;
    background-color: rgba(0, 0, 0, 0.18);
    border-radius: 50%;
    content: "";
    z-index: 0;
  }
  &.tinybox:before {
    top: 78.5%;
  }
  ${Object.entries(colorsAlternate2).map(([name, hex]) => `
  &.${name}.shadow:before {
    background-color: ${hex};
  }`)}
`

export const Top = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10002;
  span {
    font-weight: 700;
  }
`

export const Mewtations = styled.div`
  position: absolute;
  bottom: 12px;
  left: 12px;
  max-width: calc(50% - 16px);
  display: flex;
  flex-wrap: wrap;
  overflow: hidden;
  z-index: 2;
  > img, > div {
    width: 24px;
    height: 24px;
    margin-left: ${space.xs};
  }
  > :first-child {
    margin-left: 0;
  }
`

export const FamilyJewels = styled.div`
  position: absolute;
  bottom: 12px;
  right: 12px;
  max-width: calc(50% - 16px);
  display: flex;
  align-items: center;
  overflow: hidden;
  z-index: 2;
  > div {
    display: flex;
    align-items: center;
    min-height: 0;
    justify-content: flex-end;
    > div {
      width: 14px;
      height: 14px;
      flex: 0 0 14px;
      margin-left: ${space.xs};
      &:before {
        display: none;
      }
    }
  }
`

export const Diamond = styled.div`
  width: 24px;
  height: 24px;
  background-image: url('https://cryptokitties.co/images/cattributes/mewtation-gems/diamond-lg-sprite.svg');
  background-size: 900% 100%;
  animation: ${keyframes`
    0% { background-position: 0 0; }
    11.11% { background-position: 100% 0; }
    22.22% { background-position: 200% 0; }
    33.33% { background-position: 300% 0; }
    44.44% { background-position: 400% 0; }
    55.55% { background-position: 500% 0; }
    66.66% { background-position: 600% 0; }
    77.77% { background-position: 700% 0; }
    88.88% { background-position: 800% 0; }
    100% { background-position: 900% 0; }
  `} 3s steps(8) infinite;
`
