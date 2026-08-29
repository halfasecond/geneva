// @ts-nocheck
import styled from 'styled-components'
import * as Styled from 'kittyFamily/style'
import { breaks, fontSize, gutters } from 'kittyFamily/style/config'

export const Main = styled(Styled.Main)`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100%;
`

export const Section = styled.section`
  width: 100%;
  max-width: 1592px;
  margin: 0 auto;
  position: relative;
`

export const Divider = styled.div`
  width: 25%;
  @media (min-width: 760px) {
    display: none;
  }
`

export const Div = styled.div`
  display: flex;
  justify-content: center;
  justify-content: space-around;
  &.row1, &.row2, &.row3, &.row4 {
    overflow: hidden;
    > div {
      width: 20%;
      > div {
        font-size: 12px;
        @media (min-width: 700px) {
          font-size: 14px;
        }
        > div > div > img {
          display: none;
          @media (min-width: 700px) {
            display: block;
          }
        }
      }
    }
  }
  &.row1 {
    > div {
      width: 50%;
      @media (min-width: 700px) {
        width: 35%;
      }
      > img {
        min-width: 300px;
        max-width: 360px;
      }
      > div {
        > div {
          &:first-of-type {
            margin: -32px 0 12px;
            height: 18px;
            > div {
              width: 18px;
              margin-right: 4px;
              &:last-of-type {
                margin-right: 0;
              }
            }
          }
          &:nth-of-type(2) {
            margin-bottom: 8px;
            a {
              font-size: 16px;
            }
          }
          &:last-of-type {
            margin: 16px 0 12px;
            height: 12px;
            > div {
              width: 12px;
              margin-right: 4px;
              &:last-of-type {
                margin-right: 0;
              }
            }
          }
          margin-bottom: 4px;
          &:nth-of-type(4), &:nth-of-type(5), &:nth-of-type(7) {
            display: none;
          }
        }
      }
    }
  }
  &.row2 {
    @media (min-width: 700px) {
      justify-content: center;
    }
    > div {
      width: 40%;
      @media (min-width: 700px) {
        width: 25%;
      }
      > img {
        &.kitty-img {
          min-width: 180px;
        }
        max-width: 300px;
      }
      > div {
        > div {
          &:first-of-type {
            margin: -30px 0 12px;
            height: 16px;
            > div {
              width: 16px;
              margin-right: 3px;
              &:last-of-type {
                margin-right: 0;
              }
            }
          }
          &:nth-of-type(2) {
            margin-bottom: 8px;
            a {
              font-size: 16px;
            }
          }
          &:last-of-type {
            margin: 16px 0 12px;
            height: 12px;
            > div {
              width: 12px;
              margin-right: 4px;
              &:last-of-type {
                margin-right: 0;
              }
            }
          }
          margin-bottom: 4px;
          &:nth-of-type(4), &:nth-of-type(5), &:nth-of-type(7) {
            display: none;
          }
        }
      }
    }
  }
  &.row3 {
    > div {
      > img {
        max-width: 200px;
        min-width: 80px;
      }
      > div {
        > div {
          &:first-of-type {
            margin: -20px 0 12px;
            height: 16px;
            > div {
              width: 16px;
              margin-right: 3px;
              &:last-of-type {
                margin-right: 0;
              }
            }
          }
          &:nth-of-type(2) {
            margin-bottom: 8px;
            a {
              font-size: 12px;
              @media (min-width: 500px) {
                font-size: 14px;
              }
            }
          }
          &:last-of-type {
            margin: 16px 0 12px;
            height: 12px;
            > div {
              width: 12px;
              margin-right: 4px;
              &:last-of-type {
                margin-right: 0;
              }
            }
          }
          margin-bottom: 2px;
          &:nth-of-type(3), &:nth-of-type(6) {
            display: none;
          }
          > img {
            display: none;
          }
          @media (min-width: 700px) {
            &:nth-of-type(4), &:nth-of-type(5) {
              display: none;
            }
            &:nth-of-type(3) {
              display: block;
            }
            > img {
              display: block;
              margin-left: 4px;
            }
          }
        }
      }
    }
  }
  &.row4 {
    margin-bottom: ${gutters['xxl']};
    > div {
      > img {
        max-width: 120px;
        min-width: 45px;
      }
      > div {
        > div {
          &:first-of-type {
            margin: -12px 0 6px;
            height: 11px;
            > div {
              width: 11px;
              margin-right: 2px;
              &:last-of-type {
                margin-right: 0;
              }
            }
          }
          &:nth-of-type(2) {
            margin-bottom: 4px;
            a {
              font-size: 9px;
              @media (min-width: 500px) {
                font-size: 12px;
              }
            }
          }
          &:last-of-type {
            margin: 16px 0 12px;
            height: 10px;
            > div {
              width: 10px;
              margin-right: 1px;
              &:last-of-type {
                margin-right: 0;
              }
            }
            @media (min-width: 600px) {
              height: 12px;
              > div {
                width: 12px;
                margin-right: 3px;
                &:last-of-type {
                  margin-right: 0;
                }
              }
            }

          }
          margin-bottom: 2px;
          &:nth-of-type(3), &:nth-of-type(5), &:nth-of-type(6), &:nth-of-type(7) {
            display: none;
          }
          @media (min-width: 540px) {
            &:nth-of-type(5), &:nth-of-type(7) {
              display: block;
            }
          }
          &:last-of-type {
            margin-top: 6px;
          }
          font-size: 9px;
        }
      }
      > span {
        display: none;
      }
    }
  }
`

export const Hr = styled.div`
  border-top: 1px solid #000;
  margin: 0 auto;
  position: relative;
  &:before, &:after {
    content: '';
    position: absolute;
    height: 8px;
  }
  &:before {
    left: 0;
    border-left: 1px solid #000;
  }
  &:after {
    right: 0;
    border-right: 1px solid #000;
  }
`

export const Modal = styled(Styled.Modal)`
  > div {
    > div {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-bottom: ${gutters['xl']};
      width: 92%;
      @media (min-width: ${breaks['lg']}) {
        width: 57.5%;
      }
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
