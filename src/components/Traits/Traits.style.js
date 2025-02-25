import styled from 'styled-components'

export const Ul = styled.ul`
  display: flex;
  position: relative;
  flex-wrap: no-wrap;
  z-index: 1;
  > h2 {
    font-size: 10px;
    > span {
      display: inline-block;
      margin-left: 24px;
      font-weight: normal;
    }
  }
`

export const Li = styled.li`
    background-color: #dadee9;
    padding: 20px;
    border-radius: 6px;
    margin-right: 20px;
    align-self: flex-start;
    > h4 {
        font-size: 14px;
        margin-bottom: 20px;
    }
    > ul {
        padding-left: 0;
        display: flex;
        flex-wrap: no-wrap;
        flex-direction: column;
        margin-bottom: 24px;
        > li {
            font-size: 12px;
            margin: 4px 0;
            color: #000;
            line-height: 18px;
        }
    }
`
