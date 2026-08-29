import styled from 'styled-components'
import diamond from './svg/diamond.svg'
import gilded from './svg/gilded.svg'
import amethyst from './svg/amethyst.svg'
import lapis from './svg/lapis.svg'

const jewelUrl = (type?: string) => {
    if (type === 'diamond') return diamond
    if (type === 'gilded') return gilded
    if (type === 'amethyst') return amethyst
    if (type === 'lapis') return lapis
    return ''
}

export const Div = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  &:first-of-type {
    padding-top: 12px;
  }
  min-height: 20px;
`

export const Jewel = styled.div<{ $larger?: boolean; $type?: string; $trait?: string }>`
  width: ${({ $larger }) => $larger ? '20px' : '14px'};
  height: ${({ $larger }) => $larger ? '20px' : '14px'};
  position: relative;
  margin-right: 6px;
  cursor: pointer;
  &:last-of-type {
    margin-right: 0;
  }
  background-image: url(${({ $type }) => jewelUrl($type)});
  background-size: 100% auto;
  &:after {
    content: '${({ $trait }) => ($trait || '').replace(/['"]/g, '')}';
    opacity: 0;
    position: absolute;
    left: -50%;
    top: -20px;
    font-size: 12px;
    font-weight: normal;
    background-color: #FFF;
    padding: 2px 6px;
    z-index: 100;
    border-radius: 4px;
    white-space: nowrap;
  }
  &:hover {
    &:after {
      opacity: 1;
    }
  }
`
