// @ts-nocheck
import styled from 'styled-components'

export const Div = styled.div`
  margin-top: 20px;
  position: absolute;
  display:flex;
  flex-direction: column;
  align-items: center;
  right: 10px;
  top: 0;
  width: auto !important;
  @media (min-width: 700px) {
    margin-top: 50px;
    width: 25%;
    position: relative;
    width: ${({ larger }) => larger ? '100%' : '20% !important'};
    margin-left: ${({ larger }) => larger ? 0 : '4%'};
    margin-right: ${({ larger }) => larger ? 0 : '1%'};
  }
  z-index: 100;

  > img {
    width: 40px;
    @media (min-width: 700px) {
      width: 60px;
    }
    opacity: ${({ larger }) => larger ? 1 : 0.8};
  }

  h1 {
    font-size: 2.6vw;
    line-height: 4.2vw;
    opacity: ${({ larger }) => larger ? 1 : 0.8};
    @media (min-width: 1792px) {
      font-size: 48px;
      line-height: 76px;
    }
  }

  h2 {
    font-size: ${({ larger }) => larger ? '1.2vw' : '1.2vw'};
    opacity: ${({ larger }) => larger ? 1 : 0.8};
    margin-bottom: 20px;
    @media (min-width: 1792px) {
      font-size: 22px;
    }
  }

  h1, h2 {
    color: #333;
    a {
      color: #333;
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }
  }
`
