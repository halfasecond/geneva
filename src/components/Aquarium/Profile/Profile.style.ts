import styled from 'styled-components'

export const Form = styled.form`
    > div {
        margin-bottom: 24px;
        &:last-of-type {
            margin-bottom: 0;
        }
    }
    margin-bottom: 36px;

`

export const Div = styled.div`
    display: flex;
    flex-wrap: wrap;
    > div {
        font-size: 18px;
        &:first-of-type {
            width: 100px;
            font-weight: bold;
            opacity: 0.8;
        }

        &:last-of-type {
            padding-right: 24px;
            font-weight: bold;
            > span {
                display: inline-block;
                opacity: 0.8;
                margin-left: 12px;
                font-size: 12px;
                border-bottom: 2px dotted;
                padding-bottom: 4px;
                cursor: pointer;
            }

            > a {
                display: inline-block;
                opacity: 0.8;
                border-bottom: 2px dotted;
            }
        }
    }
`