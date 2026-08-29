// @ts-nocheck
import styled, { keyframes } from 'styled-components'
import { gutters } from 'kittyFamily/style/config'
import { colors, fontSize, grey } from 'kittyFamily/style/config'

export const Container = styled.div`
  position: relative;
  box-sizing: border-box;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  > img {
    cursor: pointer;
    &:hover {
      opacity:0.95;
    }
  }
  > h3 {
    margin-top: ${gutters['xs']};
    display: flex;
    width: 100%;
    justify-content: flex-start;
    align-items: center;
    color: #333;
    > img {
      width: 20px;
      margin-right: ${gutters['xs']};
    }
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  > h4 {
    margin: ${gutters['xs']} 0 ${gutters['xxs']};
    display: flex;
    width: 100%;
    justify-content: flex-start;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #777;
  }
  > p {
    width: 100%;
    font-size: ${fontSize['sm']};
  }
`

export const Div = styled.div`
  div {
    display: flex;
    justify-content: center;
    > div {
      > a {
        font-weight: bold;
      }
      > img {
        width: 12px;
        cursor:pointer;
        margin-left: 4px;
      }
    }
  }
`

export const ImageContainer = styled.div`
    width: 100%;
    aspect-ratio: 1/1;
    position: relative;
    border-radius: 100%;
    overflow: hidden;
    width: ${({ size }) => size};
    border: 1px solid ${grey[300]};
    > div {
      position: absolute;
      width: 180%;
      aspect-ratio: 1/1;
      left: -36%;
      top: -22%;
      &.shadow {
        &:before {
          position: absolute;
          top: 73%;
          left: -2%;
          right: 0;
          width: 55%;
          height: 6.2%;
          margin: auto;
          background-color: rgba(0,0,0,0.2);
          border-radius: 50%;
          content: "";
          z-index: 0;
        }
      }
      &.tinybox {
        &:before {
          top: 79.25%;
        }
      }
      > img {
        width: 100%;
        z-index: 1;
        position: relative;
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
      > div.bottom {
        position: absolute;
        width: 100%;
        bottom: ${gutters['md']};
        display: flex;
        justify-content: center;
      }
      > div.top {
        position: absolute;
        top: ${gutters['sm']};
        left: ${gutters['sm']};
      }
    }
   
`

export const Mewtations = styled.div`
    position: absolute;
    bottom: ${gutters['sm']};
    right: ${gutters['xs']};
    display: flex;
    > img {
      width: 24px;
      margin-left: ${gutters['xs']};
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
    margin-left: ${gutters['xs']};
`

export const Modal = styled.div`
    top: 0;
    left: 0;
    position: fixed;
    width: 100%;
    height: 100vh;
    background-color: rgba(0,0,0,0.4);
    z-index: 1000000000000;
    display: flex;
    align-items: center;
    justify-content: center;
    
    > div {
        position: relative;
        > svg {
            width: 30px;
            height: 30px;
            position: absolute;
            top: ${gutters['sm']};
            right: ${gutters['sm']};
        }
        padding: ${gutters['lg']};
        width: 90%;
        max-width: 600px;
        background-color: ${grey[100]};
        border-radius: ${gutters['sm']};
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        > img {
            width: 50%;
            margin-bottom: ${gutters['md']};
        }
        h2 {
            margin-bottom: ${gutters['md']};
            font-size: ${fontSize['xl']};
        }
        > a {
            color: ${colors.bubblegum};
            font-weight: bold;
            margin-bottom: ${gutters['xl']};
        }
        > p {
            margin-bottom: ${gutters['md']};
            width: 100%;
            text-align: center;
            > a {
              border-bottom: 2px dotted #777;
              &:hover {
                text-decoration: none;
                border-bottom: 2px dotted #444;
              }
            }
        }
    }
`
