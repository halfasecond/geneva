// @ts-nocheck
import styled from 'styled-components'
import * as Styled from 'kittyFamily/style'
import { breaks, fontSize, grey, gutters } from 'kittyFamily/style/config'

export const Modal = styled(Styled.Modal)`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${gutters['md']};
  box-sizing: border-box;
  > div.kitty-detail {
    display: flex;
    flex-direction: column;
    width: min(92vw, 400px);
    height: auto;
    max-height: 90vh;
    max-width: 400px;
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
    align-items: stretch;
    @media (min-width: ${breaks['md']}) {
      flex-direction: row;
      width: min(94vw, 840px);
      max-width: 840px;
      max-height: 86vh;
      align-items: stretch;
    }
    > img.close {
      top: 10px;
      right: 10px;
      width: 32px;
      height: 32px;
      padding: 4px;
      box-sizing: border-box;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    }
    > .card-art {
      width: 100%;
      aspect-ratio: 1 / 1;
      flex-shrink: 0;
      overflow: hidden;
      box-sizing: border-box;
      padding: 12%;
      @media (min-width: ${breaks['md']}) {
        width: 50%;
        max-width: none;
        aspect-ratio: auto;
        min-height: 0;
        align-self: stretch;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 6%;
      }
      > div {
        width: 100%;
        height: auto;
        > div {
          border-radius: 0;
        }
      }
    }
    > .card-body {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      width: 100%;
      padding: ${gutters['md']};
      background: #fff;
      overflow: auto;
      @media (min-width: ${breaks['md']}) {
        flex: 1;
        padding: ${gutters['lg']} ${gutters['lg']} ${gutters['md']};
      }
      > .mewtations {
        margin: 0 0 ${gutters['xxs']};
      }
      > h2,
      > h3,
      > h4 {
        font-weight: 400;
      }
      > h2 {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        font-size: ${fontSize['lg']};
        font-weight: 400;
        line-height: 1.15;
        margin: 0 0 2px;
        max-width: 100%;
        white-space: normal;
        overflow: visible;
        text-overflow: unset;
        > span {
          font-size: ${fontSize['sm']};
          font-weight: 400;
          letter-spacing: 0.04em;
          color: ${grey[600]};
        }
      }
      > h3 {
        font-size: ${fontSize['sm']};
        color: ${grey[700]};
        font-weight: 400;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        margin: 0;
        max-width: 100%;
        text-align: left;
        white-space: normal;
      }
      > .tabs {
        display: flex;
        gap: ${gutters['lg']};
        margin: ${gutters['sm']} 0 ${gutters['sm']};
        border-bottom: 1px solid ${grey[200]};
        > button {
          appearance: none;
          background: none;
          border: 0;
          padding: 0 0 ${gutters['xs']};
          margin: 0 0 -1px;
          font-family: bungee, sans-serif;
          font-weight: 400;
          font-size: ${fontSize['sm']};
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: ${grey[500]};
          cursor: pointer;
          border-bottom: 2px solid transparent;
          &.on {
            color: ${grey[800]};
            border-bottom-color: ${grey[800]};
          }
        }
      }
      > .panel {
        min-height: 0;
        > p.bio {
          background: ${grey[50]};
          padding: ${gutters['xs']} ${gutters['sm']};
          margin: 0;
          border-radius: 8px;
          font-size: ${fontSize['sm']};
          font-weight: 400;
          line-height: 1.4;
          b {
            font-weight: 400;
          }
        }
        > .genes {
          display: flex;
          align-items: flex-start;
          margin: 0 0 ${gutters['sm']};
          width: 100%;
          > code {
            display: block;
            background: ${grey[50]};
            padding: ${gutters['xs']} ${gutters['sm']};
            font-size: 10px;
            font-weight: 400;
            letter-spacing: 0.02em;
            border-radius: 8px;
            flex: 1;
            white-space: pre-wrap;
            word-break: break-all;
            line-height: 1.35;
            color: ${grey[800]};
          }
        }
        > p.stats,
        > p.owner,
        > p.offspring {
          font-size: ${fontSize['sm']};
          font-weight: 400;
          margin: 0 0 4px;
          line-height: 1.4;
          color: ${grey[800]};
          word-break: break-word;
        }
        > p.owner {
          color: ${grey[600]};
          > a {
            font-weight: 400;
            word-break: break-all;
          }
        }
        > p.offspring {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 10px;
          > a {
            font-weight: 400;
          }
        }
        > ul.history {
          list-style: none;
          margin: ${gutters['sm']} 0 0;
          padding: 0;
          > li {
            font-size: ${fontSize['sm']};
            font-weight: 400;
            line-height: 1.35;
            margin: 0 0 ${gutters['sm']};
            color: ${grey[800]};
            > a {
              font-weight: 400;
            }
            > span {
              display: block;
              color: ${grey[600]};
              font-size: ${fontSize['xs']};
            }
          }
        }
      }
    }
  }
`
