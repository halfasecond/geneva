// @ts-nocheck
import styled from 'styled-components'
import * as Styled from 'kittyFamily/style'
import { grey, gutters, fontSize } from 'kittyFamily/style/config'

export const Div = styled.div`
    max-width: 1792px;
    margin: 0 auto;
    padding: ${gutters['xxl']} ${gutters['md']} 0;
    > div {
        &:first-of-type {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            > div {
                margin-bottom: ${gutters['md']};
            }
        }
        > img {
            width: 120px;
            &.placeholder {
                width: 80px;
            }
        }
        > p {
            font-size: ${fontSize['md']};
            margin-bottom: ${gutters['md']};
        }
        
    }
`

export const FollowC2A = styled.div`
    border: 1px solid ${grey[400]};
    margin: 0 auto;
    padding: ${gutters['xs']} ${gutters['sm']};
    margin-top: ${gutters['md']};
    font-size: ${fontSize['sm']};
    font-weight: bold;
    display: flex;
    align-items: center;
    border-radius: ${gutters['xxs']};
    > img {
        width: 20px;
        margin-left: ${gutters['sm']};
    }
    cursor: pointer;
    &:hover {
        background-color: ${grey[100]};
    }
`


export const Grid = styled(Styled.Grid)`
    margin: 0 4% ${gutters['xlg']};
`

export const Modal = styled(Styled.Modal)`
    > div {
        background-color: ${grey[0]};
        padding-top: ${gutters['xxl']};
        max-width: ${({ wider }) => wider ? '1200px' : '800px'};
    }
`

export const SelectedKitty = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    > h3 {
        margin-top: ${gutters['sm']};
        margin-bottom: ${gutters['lg']};
    }
    > div {
        position: relative;
        margin-top: ${gutters['md']};
        margin-bottom: ${gutters['xl']};
        &.success {
            &:after {
                content: '✅';
                position: absolute;
                left: 100%;
                top: 4px;
                margin-left: ${gutters['sm']};
                font-size: ${fontSize['ml']};
            }
        }
    }
    
    > p {
        text-align: center;
        margin: 0 ${gutters['xl']};
    }
    hr {
        color: ${grey[200]};
        width: 90%;
        margin: 0 ${gutters['xl']} ${gutters['md']};
    }
    > input {
        width: 300px;
        padding: ${gutters['xs']};
    }
`