import styled from 'styled-components'


export const Item = styled.div`
    width: 100px;
    height: 100px;
    background-repeat: no-repeat;
    position: relative;
    &:after {
        content: '${({ utility }) => utility}';
        position: absolute;
        width: 100%;
        text-align: center;
        top: 120px;
        font-size: 12px;
        line-height: 16px;
    }
`

export const Div = styled.div`
    position: absolute;
    > div {
        display: flex;
        flex-direction: column;
        position: relative;
        width: 180px;
        > h2 {
            position: absolute;
            margin: -47px 0 0 -16px;
            opacity: 0.5;
        }  
        > ${Item} {
            margin-bottom: 80px;
            background-size: 300%;
            background-position: 105% 72%;
            &:nth-of-type(8), &:nth-of-type(14) {
               background-position: 100% -2%;
            }
        }
    }
    
`

