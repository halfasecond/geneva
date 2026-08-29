// @ts-nocheck
import styled from 'styled-components'
import { gutters } from 'kittyFamily/style/config'
import diamond from 'kittyFamily/svg/diamond.svg'
import gilded from 'kittyFamily/svg/gilded.svg'
import amethyst from 'kittyFamily/svg/amethyst.svg'
import lapis from 'kittyFamily/svg/lapis.svg'

export const Div = styled.div`
  display: flex;
  justify-content: center;
  min-height: 20px;
  margin-bottom: ${gutters['md']};
`

export const Jewel = styled.div`
  position: relative;
  width: 24px;
  height: 24px;
  cursor: ${({ type }) => type === 'none' ? 'default' : 'pointer'};
  &:before {
    content: '';
    display: block;
    padding-top: 100%;
  }
  background-image: ${({ type }) => {
    switch(type) {
      case 'diamond':
        return `url('${diamond}')`
      case 'gilded':
        return `url('${gilded}')`
      case 'amethyst':
        return `url('${amethyst}')`
      case 'lapis':
        return `url('${lapis}')`
      default:
        return 'none'
    }
  }};
  background-size: 100% auto;
  background-repeat: no-repeat;
  &:after {
    content: '${({ trait }) => trait}';
    opacity: 0;
    position: absolute;
    left: -50%;
    top: ${({ displayType }) => displayType === 'mewtations' ? '-20px' : '20px'};
    font-size: 12px;
    font-weight: normal;
    background-color: #FFF;
    padding: 2px 6px;
    z-index: 100;
    border-radius: 4px;
  }
  &:hover {
    &:after {
      opacity: ${({ type }) => type === 'none' ? 0 : 1};
    }
  }
`
