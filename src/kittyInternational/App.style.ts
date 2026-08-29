import styled from 'styled-components'

export const Div = styled.div`
  text-align: center;
  padding: 0 5% 144px;
  box-sizing: border-box;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100%;
`

export const Section = styled.section`
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 40px;
  justify-content: center;
  > h2, p {
    width: 100%;
    > a {
      text-decoration: underline;
    }
  }
  > p {
    margin-bottom: 10px;
    > span {
      text-decoration: underline;
      font-style: italic;
      cursor: pointer;
    }
  }
`
