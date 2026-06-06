import styled from 'styled-components'

export const Div = styled.div`
    display: flex;
    width: 90%;
    margin-left: 5%;
    padding: 96px 0;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    > blockquote {
        background-color: #d6d6d6;
        font-family: monospace;
        padding: 12px 24px;
        border-radius: 4px;
        font-weight: bold;
        text-align: center;
        line-height: 28px;
        font-size: 18px;
        box-shadow: 10px 10px 30px rgba(0, 0, 0, 0.1);
        > a {
            border-bottom: 2px dotted; 
        }
    }
`

export const Grid = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    max-width: 1780px;
`

export const colors = {
    blue: 'rgba(0,176,216,1)'
}