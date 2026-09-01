// @ts-nocheck
import styled from 'styled-components'
import { breaks, colors, fontSize, grey, gutters } from 'kittyFamily/style/config'
import * as Styled from 'kittyFamily/style'

export const Div = styled.div`
    display: flex;
    flex-wrap: wrap;
    width: 94%;
    margin: 0 auto;
    > div {
        display: flex;
        justify-content: flex-start;
        align-items: flex-start;
        flex-direction: column;
        margin-bottom: ${gutters['xlg']};
        margin-right: 0;
        width: 100%;
        position: relative;
        @media (min-width: ${breaks['sm']}) {
			width: 48%;
			margin-right: 4%;
			&:nth-of-type(2n) {
				margin-right: 0;
			}
		}
		@media (min-width: ${breaks['lg']}) {
			width: 23.5%;
			margin-right: 2%;
			&:nth-of-type(2n) {
				margin-right: 2%;
			}
			&:nth-of-type(4n) {
				margin-right: 0;
			}
		}
		@media (min-width: ${breaks['xxxl']}) {
			width: 18.5%;
			margin-right: 1.875%;
			&:nth-of-type(2n) {
				margin-right: 1.875%;
			}
			&:nth-of-type(4n) {
				margin-right: 1.875%;
			}
			&:nth-of-type(5n) {
				margin-right: 0;
			}
		}
        > div {
            width: 100%;
            aspect-ratio: 1/1;
            border-radius: ${gutters['xs']};
            border: 1px solid #EEE;
            background-color: #E5E5E5;
            margin-bottom: ${gutters['sm']};
            position: relative;
            &:hover {
                border: 1px solid #CCC;
            }
            &:before {
                position: absolute;
                top: 72.25%;
                left: -1.5%;
                right: 0;
                width: 53%;
                height: 6.2%;
                margin: auto;
                background-color: rgba(0,0,0,0.2);
                border-radius: 50%;
                content: "";
                z-index: 0;
            }
            > img {
                width: 100%;
                z-index: 1;
                position: absolute;
                left: 0;
                top: 0;
                &.kitty-hat {
                    position: absolute;
                    &.dada {
                      left: 0.5%;
                      top: 39%;
                      width: 35%;
                      border-radius: 4px;
                      z-index: 10000;
                    }
                    &.easel {
                        z-index: 9999;
                    }
                    &.cucumber {
                        z-index: 10;
                    }
                }
            }
            > span {
                right: ${gutters['sm']};
                bottom: ${gutters['sm']};
            }
        }
        > img {
            width: 100%;
            position: absolute;
            &.bug {
                width: 12%;
                right: ${gutters['sm']};
                top: ${gutters['sm']};
            }
        }

        > h3 {
            max-width: 90%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        > h4 {
            max-width: 90%;
            font-size: ${fontSize['md']};
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }
`

export const KittyWithHatPreview = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 86%;
    > img {
        width: 40px;
    }
    > h3 {
        font-size: ${fontSize['xxl']};
        margin: ${gutters['xlg']} auto ${gutters['lg']};
        line-height: 40px;
    }
    > button {
        padding: ${gutters['xs']} ${gutters['sm']};
        font-weight: bold;
        line-height: 20px;
        margin: 0 ${gutters['xs']} ${gutters['lg']};
    }
    > ol {
        margin-bottom: ${gutters['sm']};
        > li {
            list-style-type: none;
            margin-bottom: ${gutters['xs']};
            line-height: 28px;
        }
        
    }
`

export const Grid = styled(Styled.Grid)`
    width: 100%;
    max-width: 100%;
    margin: 0 0 ${gutters['xlg']};
    padding: 0 4%;
    box-sizing: border-box;
`

export const Modal = styled(Styled.Modal)`
    overscroll-behavior: contain;
    > div {
        background-color: #FFF;
        padding-top: ${gutters['xxl']};
        max-width: ${({ wider }) => wider ? '1200px' : '800px'};
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
        box-sizing: border-box;
    }
`

export const KittyHat = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    width: 86%;
    background-color: #FFF;
    
    margin-bottom: ${gutters['xlg']};
    position: relative;
    > div {
        &:first-of-type {
            width: 100%;
            max-width: 600px;
            aspect-ratio: 1/1;
            border-radius: ${gutters['xs']};
            border: 1px solid #EEE;
            background-color: #E5E5E5;
            margin-bottom: ${gutters['xl']};
            position: relative;
            &:before {
                position: absolute;
                top: 72.25%;
                left: -1.5%;
                right: 0;
                width: 53%;
                height: 6.2%;
                margin: auto;
                background-color: rgba(0,0,0,0.2);
                border-radius: 50%;
                content: "";
                z-index: 0;
            }
            > img {
                width: 100%;
                z-index: 1;
                position: absolute;
                left: 0;
                top: 0;
                &.kitty-hat {
                    position: absolute;
                    &.dada {
                      left: 0.5%;
                      top: 39%;
                      width: 35%;
                      border-radius: 4px;
                    }
                }
            }
            > span {
                margin-left: ${gutters['sm']};
            }
        }
        &:last-of-type {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: ${gutters['xl']};
            > div {
                display: flex;
                flex-direction: column;
                align-items: center;
                > img {
                    width: 40px;
                }
                > button {
                    padding: ${gutters['xs']} ${gutters['sm']};
                    font-weight: bold;
                    line-height: 20px;
                    margin: 0 ${gutters['xs']};
                }
            }
        }
    }
    > h3 {
        font-size: ${fontSize['xl']};
        margin-bottom: ${gutters['sm']};
    }
    > h4 {
        font-size: ${fontSize['lg']};
        margin-bottom: ${gutters['lg']};
        
    }
    > p {
        width: 96%;
        margin-bottom: ${gutters['sm']};
    }
    > ol {
        margin-bottom: ${gutters['sm']};
        > li {
            list-style-type: none;
            margin-bottom: ${gutters['xs']};
            line-height: 28px;
        }
        
    }
`

export const Modal2 = styled.div`
    top: 0;
    left: 0;
    position: fixed;
    width: 100%;
    height: 100vh;
    background-color: rgba(0,0,0,0.4);
    z-index: 1000000000000;
    display: flex;
    align-items: center;
    justify-content: center;
    > div {
        position: relative;
        margin: 0 2%;
        padding: ${gutters['xl']} ${gutters['lg']} ${gutters['lg']};
        width: 90%;
        max-width: 600px;
        background-color: ${grey[100]};
        border-radius: ${gutters['sm']};
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        > img {
            width: 50%;
            margin-bottom: ${gutters['md']};
        }
        > svg,
        > img.close {
            width: 30px;
            height: 30px;
            position: absolute;
            top: ${gutters['sm']};
            right: ${gutters['sm']};
            margin: 0;
            cursor: pointer;
        }
        h2 {
            margin-bottom: ${gutters['md']};
            font-size: ${fontSize['xl']};
        }
        > a {
            color: ${colors.bubblegum};
            font-weight: bold;
            margin-bottom: ${gutters['xl']};
        }
        > p {
            margin-bottom: ${gutters['md']};
            width: 100%;
            text-align: center;
        }
    }
`

export const Modal3 = styled.div`
    top: 0;
    left: 0;
    position: fixed;
    width: 100%;
    height: 100vh;
    background-color: rgba(0,0,0,0.4);
    z-index: 1000000000000;
    display: flex;
    align-items: center;
    justify-content: center;
    > div {
        position: relative;
        margin: 0 2%;
        padding: ${gutters['xl']} ${gutters['lg']} ${gutters['lg']};
        width: 90%;
        max-width: 600px;
        background-color: ${grey[100]};
        border-radius: ${gutters['sm']};
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        > svg,
        > img.close {
            width: 30px;
            height: 30px;
            position: absolute;
            top: ${gutters['sm']};
            right: ${gutters['sm']};
            margin: 0;
            cursor: pointer;
        }
        > div {
            &:first-of-type {
                width: 100%;
                max-width: 600px;
                aspect-ratio: 1/1;
                border-radius: ${gutters['xs']};
                border: 1px solid #EEE;
                background-color: #E5E5E5;
                margin-bottom: ${gutters['md']};
                > img {
                    width: 100%;
                }
                > span {
                    margin-left: ${gutters['sm']};
                }
            }
            &:last-of-type {
                width: 100%;
            }
            
        }
        h2 {
            margin-bottom: ${gutters['md']};
            font-size: ${fontSize['xl']};
        }
        > p {
            margin-bottom: ${gutters['md']};
            width: 100%;
            text-align: center;
        }
    }
`