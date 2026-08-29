// @ts-nocheck
import styled from 'styled-components';
import { fontSize, grey } from 'kittyFamily/style/config';
import { gutters } from 'kittyFamily/style/config';

export const P = styled.p`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 13px 5px 11px;
  border-radius: 5px;
  border: solid 2px #e7e6e4;
  background-color: #fcfbfa;
  font-weight: bold;
  font-size: ${fontSize['sm']};
  color: ${grey[600]};
  cursor: default;
  > img,
  > svg {
    margin-right: 8px;
  }
  > b {
    display: inline-block;
    margin-right: 4px;
    > span {
      margin: 0 1px 0 2px;
      &:last-of-type {
        margin: 0 1px 0 0;
      }
    }
  }
    > label {
        display: flex;
        font-size: ${fontSize['xs']};
        margin-left: ${gutters['sm']};
    }
  > span {
    margin-left: 8px;
    cursor: pointer;
    &:hover {
      display: inline-block;
      opacity: 0.6;
    }
  }
`;
