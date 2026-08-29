// @ts-nocheck
import styled from 'styled-components'
import { gutters, fontSize } from 'kittyFamily/style/config'

export const FixedContainer = styled.section`
    position: fixed;
    box-sizing: border-box;
    padding: ${gutters['md']};
    width: 97%;
    border-radius: ${gutters['sm']};
    border: 1px solid #EEE;
    z-index: 100;
    > input {
        width: 100%;
    }
    > h2 {
        width: 100%;
        text-align: center;
        margin-bottom: ${gutters['lg']};
        font-size: 2vw;
    }
    left: 1.5%;
    top: 60px;
    background-color: rgba(255,255,255,0.75);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`

export const Div = styled.div`
    width: 100%;
    padding: 240px ${gutters['lg']} 100px;
    font-size: 1.2vw;
    font-weight: bold;
    color: #444;
    box-sizing: border-box;
    .smaller {
        font-size: 1vw;
        font-weight: normal;
    }
    > input {
        width: 100%;
    }
    > h2 {
        width: 100%;
        text-align: center;
        margin-bottom: ${gutters['lg']};
        font-size: 2vw;
    }
    > h3 {
        text-align: center;
        font-size: 1.2vw;
        margin: ${gutters['xxl']} 0 ${gutters['md']};
    }
    > div {
        display: flex;
        align-item: center;
        justify-content: space-evenly;
        margin-bottom: ${gutters['md']};
        > div.graphKey {
            display: flex;
            align-items: center;
            > label {
                font-size: 0.75vw;
                margin-right: ${gutters['xs']};
            }
        }
    }
    > hr {
        margin: ${gutters['lg']} 0;
        opacity: 0.5;
    }

    

    .m4 {
        > div {
            width: 25%;
        }
    }
    .m3 {
        > div {
            width: 18%;
        }
    }
    .m2 {
        > div {
            width: 15%;
        }
    }
    .m1 {
        > div {
            width: 9%;
        }
    }

    .m0 {
        > div {
            width: 6%;
        }
    }
`

export const ChartContainer = styled.section`
  width: 100%;
  position: relative;
  box-sizing: border-box;
  height: 0; 
  padding-bottom: 40%;
  margin-bottom: ${gutters['lg']};
  background-color: #EEE;
  border-radius: ${gutters['xs']};
  font-size: 0.5vw;
  background-image: url('/images/icons/normal_gs.svg');
  background-repeat: no-repeat;
  background-position: center;
`;

export const ChartWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
`;

export const Cattribute = styled.div`
    font-size: ${fontSize['xs']};
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: ${gutters['xs']} 0;
    border-radius: ${gutters['xxs']};
    > div {
        margin-bottom: ${gutters['xs']};
        &:first-of-type {
            font-size: ${fontSize['sm']};
        }
        &:last-of-type {
            font-size: ${fontSize['xxs']};
            margin-bottom: 0;
        }
    }
`