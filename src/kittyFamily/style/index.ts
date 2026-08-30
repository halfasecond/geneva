// @ts-nocheck
import styled from 'styled-components'
import { breaks, gutters } from './config'

export const Main = styled.main`
  text-align: center;
  box-sizing: border-box;
  color: #333;
  position: relative;
`

export const Modal = styled.div`
    width: 100%;
    height: 100vh;
    overflow: hidden;
    background-color: rgba(0,0,0,0.6);
    position: fixed;
    top: 0;
    left: 0;
    z-index: 100000000000000000000;
    > div {
        width: 90%;
        height: 96vh;
        max-width: 1200px;
        margin: 2vh auto;
        border-radius: ${gutters['md']};
        display: flex;
        justify-content: center;
        align-items: flex-start;
        overflow: auto;
        box-sizing: border-box;
        position: relative;
        > svg,
        > img.close,
        > img.back {
            position: absolute;
            z-index: 100000000;
            top: ${gutters['lg']};
            width: 40px;
            height: 40px;
            cursor: pointer;
            &:hover {
                opacity: 0.6;
            }
        }
        > svg:first-of-type,
        > img.close {
            right: ${gutters['lg']};
        }
        > svg:nth-of-type(2),
        > img.back {
            left: ${gutters['lg']};
        }
    }
`;

export const Grid = styled.div`
    display: flex;
    flex-wrap: wrap;
    margin: 0 auto;
    justify-content: flex-start;
    align-items: flex-start;
    position: relative;
    width: 100%;
    > header {
        width: 100%;
        margin-bottom: ${gutters['md']};
        > h3 {
            margin-bottom: ${gutters['md']};
        }
    }

    > div {
        margin-bottom: ${gutters['md']};
        @media (min-width: ${breaks['sm']}) {
            width: 48%;
            margin-right: 4%;
            &:nth-of-type(2n) {
                margin-right: 0;
            }
        }
        @media (min-width: ${breaks['xl']}) {
            width: 23.5%;
            margin-right: 2%;
            &:nth-of-type(2n) {
                margin-right: 2%;
            }
            &:nth-of-type(4n) {
                margin-right: 0;
            }
        }
        
        @media (min-width: ${breaks['xxxl']}) {
            width: 18.5%;
            margin-right: 1.875%;
            &:nth-of-type(2n) {
                margin-right: 1.875%;
            }
            &:nth-of-type(4n) {
                margin-right: 1.875%;
            }
            &:nth-of-type(5n) {
                margin-right: 0;
            }
        }
    }
`

