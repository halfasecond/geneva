import styled from 'styled-components'

export const Div = styled.div`
    position: relative;
    border-radius: 8px;
    font-size: 12px;
    background: #001520;
    color: #eef;
    padding: 1rem;
    font-family: system-ui;
    box-shadow: 0 6px 24px rgba(0,0,0,0.4);
    opacity: 0.6;
    box-sizing: border-box;
    > h2 {
        font-size: 24px;
        margin-bottom: 24px;
        padding-top: 12px;
        display: block;
    }

    > p {
        margin-bottom: 24px;
        line-height: 36px;
        font-size: 16px;
        > a {
            display: inline-block;
            border-bottom: 2px dotted; 
        }
    }

    .katex-html {
        display: none;
    }

    .katex-display {
        display: block;
        margin-top: 36px;
        margin-bottom: 36px;
        font-size: 2rem;
    }

    > label {
        display: block;
        margin-bottom: 12px;
        > span, > input {
            width: 100%; 
        }
        
    }
`

export const Close = styled.div`
    position: absolute;
    top: 18px;
    right: 18px;
    cursor: pointer;
    font-size: 24px;
    font-weight: bold;
    opacity: 0.6;
    &:hover {
        opacity: 0.8;
    }
`