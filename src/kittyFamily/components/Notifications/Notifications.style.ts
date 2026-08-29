// @ts-nocheck
import styled from 'styled-components'
import { colors, fontSize, grey, gutters } from 'kittyFamily/style/config'

export const Div = styled.div`
    position: fixed;
    bottom: ${gutters['md']};
    right: ${gutters['sm']};
    width: 380px;
    z-index: 100000;
    > div {
        padding: ${gutters['sm']} ${gutters['md']};
        background-color: rgb(243, 241, 238);
        background-image: url('https://cryptokitties.co/images/pattern-tile.svg');
        background-size: 33rem;
        border: 1px solid ${grey[300]};
        border-radius: ${gutters['xs']};
        font-size: ${fontSize['sm']};
        line-height: 24px;
        margin-top: ${gutters['xs']};
        display: flex;
        align-items: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        > div {
            &:first-of-type {
                width: 36px;
                margin-right: ${gutters['sm']};
                display: flex;
                align-items: center;
            }
            > img {
                width: 36px;
                
            }
            > a {
                font-weight: bold;
                &:hover {
                    color: ${colors.bubblegum};
                }
                
            }
        }
        
    }
`