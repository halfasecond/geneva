// @ts-nocheck
import styled from 'styled-components'
import * as Styled from 'kittyFamily/style'
import { breaks, fontSize, gutters } from 'kittyFamily/style/config'

export const Modal = styled(Styled.Modal)`
  > div {

    max-width: 800px;
    > div {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-bottom: ${gutters['xl']};
      width: 80%;
      > .mewtations {
        margin-top: -${gutters['md']};
      }
      > h2 {
        font-size: ${fontSize['md']};
        @media (min-width: ${breaks['lg']}) {
          font-size: ${fontSize['xxl']};
        }
        margin-bottom: ${gutters['sm']};
        max-width: 90%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      > h3 {
        font-size: ${fontSize['md']};
        @media (min-width: ${breaks['lg']}) {
          font-size: ${fontSize['xxl']};
        }
        margin-bottom: ${gutters['md']};
        max-width: 98%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      > h4 {
        font-size: ${fontSize['md']};
        @media (min-width: ${breaks['lg']}) {
          font-size: ${fontSize['lg']};
        }
        margin-bottom: ${gutters['md']};
        max-width: 98%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 98%;
      }
      > p.bio {
        background-color: #FFF;
        padding: ${gutters['sm']};
        margin-bottom: ${gutters['lg']};
        border-radius: ${gutters['xs']};
        font-size: ${fontSize['sm']};
        @media (min-width: ${breaks['lg']}) {
          font-size: ${fontSize['md']};
        }
      }
      > .genes {
        display: flex;
        align-items: center;
        margin-bottom: ${gutters['md']};
        > code {
          display: inline-block;
          background-color: #EEE;
          padding: ${gutters['sm']};
          font-size: ${fontSize['sm']};
          font-weight: bold;
          border-radius: ${gutters['xs']};
          align-self: flex-start;
          margin-right: ${gutters['sm']};
          flex: 1;
          white-space: pre-wrap;
          word-break: break-all;
        }
        > svg {
          cursor: pointer;
          &:hover {
            opacity: 0.8;
          }
        }
      }
    }
  }
`
