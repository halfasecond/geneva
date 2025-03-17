import styled from 'styled-components'


export const Forest = styled.div`
    width: 400px;
    height: 400px;
    z-index: 1;
    position: absolute;
    opacity: 0.8;
    background-image: url('https://cdn.halfasecond.com/images/chained-horse/svg/forest.svg');
    background-size: contain;
`

export const Div = styled.div`
    position: absolute;
    width: 700px;
    > div {
        position: relative;
         > ${Forest} {
            &:first-of-type {
                left: 340px;
                top: 50px;
            }
        }
        > h2 {
            position: absolute;
            opacity: 0.4;
            font-size: 22px;
            white-space: nowrap;
            right: 0;
        }
        > p {
            position: absolute;
            top: 430px;
            left: -140px;
            width: 440px;
            line-height: 32px;
        }
    }
`

export const Bear = styled.div`
    left: 190px;
    top: 100px;
    width: 400px;
    height: 400px;
    z-index: 0;
    position: absolute;
    background-image: url('https://cdn.halfasecond.com/images/chained-horse/svg/31db13b10188de1afd6cff09cf65a0ae.svg');
    background-size: contain;
   
`

