import styled from 'styled-components'
// import bg from './images/bg.png' background-image: url(${bg});

export const Bot = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  > div {
    position: relative;
    &:first-of-type {
      max-width: 360px;
      > img {
        position: absolute;
        width: 100%;
        height: auto;
        z-index: 1;
        &:last-of-type {
          position: relative;
          z-index: 0;
        }
      } 
    }
    &:last-of-type {
      width: 100%;
      padding: 0 2.5%;
      box-sizing: border-box;
      height: 32px;
      bottom: 12px;
      display: flex;
      justify-content: space-between;
      position: absolute;
      > span {
        display: block;
        position: absolute;
        font-weight: bold;
        font-size: 11px;
        bottom: 8%;
        left: 17%;
        opacity: 0.1;
      }
      > div {
        &:first-of-type {
          width: 12%;
          margin-bottom: 4px;
          img {
            width: 100%;
            max-width: 36px;
          }
        }
        &:last-of-type {
          display: flex;
          img {
            width: 100%;
            max-width: 28px;
            margin-left: 6px;
          }
        }
      }
    }
  }
  
  
`
