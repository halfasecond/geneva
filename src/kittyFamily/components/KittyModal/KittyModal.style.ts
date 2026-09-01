// @ts-nocheck
import styled from 'styled-components'
import * as Styled from 'kittyFamily/style'
import { breaks } from 'kittyFamily/style/config'
import { color, fonts, space, typeCss } from 'kittyUi/tokens'

export const Modal = styled(Styled.Modal)`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${space.md};
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
    box-sizing: border-box;
    *, *::before, *::after {
      box-sizing: border-box;
    }
    background: ${color.paper};
    border-radius: 18px;
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
    align-items: stretch;
    ${typeCss('body')}
    h1, h2, h3, h4, h5, p, a, li, ul, code, button, span, label, b, strong {
      font-weight: 400;
    }
    p, a, li, ul, code, span, label, b, strong {
      ${typeCss('body')}
    }
    @media (min-width: ${breaks['md']}) {
      flex-direction: row;
      width: min(94vw, 920px);
      max-width: 920px;
      height: min(86vh, 640px);
      min-height: min(86vh, 520px);
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
      background: ${color.paper};
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    }
    > .card-art {
      width: 100%;
      aspect-ratio: 1 / 1;
      flex-shrink: 0;
      overflow: hidden;
      box-sizing: border-box;
      padding: 0;
      position: relative;
      @media (min-width: ${breaks['md']}) {
        width: 50%;
        flex: 0 0 50%;
        max-width: none;
        aspect-ratio: auto;
        height: 100%;
        min-height: 0;
        align-self: stretch;
        display: flex;
        align-items: stretch;
        justify-content: stretch;
        padding: 0;
      }
      > div {
        width: 100%;
        height: 100%;
      }
      span {
        font-weight: 700;
      }
    }
    > .card-body {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      width: 100%;
      padding: ${space.md};
      background: ${color.paper};
      overflow: hidden;
      min-height: 0;
      @media (min-width: ${breaks['md']}) {
        flex: 1;
        min-height: 0;
        padding: ${space.lg} ${space.lg} ${space.md};
      }
      > h2,
      > h3,
      > h4 {
        font-family: ${fonts.display};
        font-weight: 400;
      }
      > h2 {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        ${typeCss('displayLg')}
        margin: 0 0 2px;
        max-width: 100%;
        white-space: normal;
        overflow: visible;
        text-overflow: unset;
        > span {
          ${typeCss('displayMd')}
          letter-spacing: 0.04em;
          color: ${color.muted};
        }
      }
      > h3 {
        ${typeCss('displayMd')}
        color: ${color.ink};
        letter-spacing: 0.06em;
        text-transform: uppercase;
        margin: 0 0 ${space.md};
        padding-bottom: ${space.sm};
        max-width: 100%;
        text-align: left;
        white-space: normal;
      }
      > .tabs {
        display: flex;
        gap: ${space.lg};
        margin: 0 0 ${space.sm};
        border-bottom: 1px solid ${color.line};
        > button {
          appearance: none;
          background: none;
          border: 0;
          padding: 0 0 ${space.xs};
          margin: 0 0 -1px;
          ${typeCss('displayMd')}
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: ${color.faint};
          cursor: pointer;
          border-bottom: 2px solid transparent;
          &.on {
            color: ${color.ink};
            border-bottom-color: ${color.ink};
          }
        }
      }
      > .panel {
        flex: 1;
        min-height: 0;
        overflow-x: hidden;
        overflow-y: auto;
        scrollbar-gutter: stable;
        padding-right: ${space.sm};
        p, a, li, code, span, b, strong {
          ${typeCss('body')}
        }
        > .bio {
          background: ${color.wash};
          padding: ${space.sm} ${space.sm};
          margin: ${space.xs} 0;
          max-width: 100%;
          border-radius: 8px;
          overflow-wrap: break-word;
          word-break: break-word;
          ${typeCss('body')}
          p, div, span {
            max-width: 100%;
            overflow-wrap: break-word;
            word-break: break-word;
          }
        }
        > .genes {
          display: flex;
          align-items: flex-start;
          margin: 0 0 ${space.sm};
          width: 100%;
          max-width: 100%;
          > code {
            display: block;
            background: ${color.wash};
            padding: ${space.xs} ${space.sm};
            font-family: ${fonts.body};
            font-size: 16px;
            font-weight: 700;
            line-height: 1.35;
            letter-spacing: 0;
            border-radius: 8px;
            flex: 1;
            white-space: pre-wrap;
            word-break: break-all;
            color: ${color.ink};
          }
        }
        .kitty-genes {
          label, span {
            font-weight: unset;
          }
          b, strong {
            font-weight: 700;
          }
        }
        > p.stats,
        > p.owner,
        > p.born {
          ${typeCss('body')}
          margin: 0 0 4px;
          color: ${color.ink};
          word-break: break-word;
          > b {
            font-weight: 700;
          }
        }
        > p.owner,
        > p.born {
          ${typeCss('body')}
          color: ${color.ink};
          margin-top: ${space.sm};
          > a {
            ${typeCss('body')}
            font-weight: 700;
            color: ${color.ink};
            overflow-wrap: anywhere;
            > b {
              font-weight: 700;
            }
          }
        }
        @media (min-width: ${breaks['md']}) {
          > p.owner {
            white-space: nowrap;
          }
        }
        > p.born {
          margin-top: 2px;
        }
        > p.offspring {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 10px;
        }
        > ul.history {
          list-style: none;
          margin: ${space.sm} 0 0;
          padding: 0;
          > li {
            list-style: none;
            margin: 0 0 ${space.sm};
            padding: 0;
            ${typeCss('body')}
            color: ${color.ink};
            > span {
              display: block;
              ${typeCss('caption')}
              color: ${color.muted};
            }
          }
        }
      }
    }
  }
`
