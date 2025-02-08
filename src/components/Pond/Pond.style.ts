import styled from 'styled-components'

export const PondContainer = styled.div`
    position: absolute;
    width: 500px;
    height: 400px;  // Increased height
    background-color: #37d7ff;
    border-radius: 8px;  // Slightly larger radius
    z-index: 1;
    display: flex;
    justify-content: flex-end;
    box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.3);  // Add subtle inner highlight
    overflow: hidden;
    
    &::after {  // Add subtle wave effect
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 40%;
        background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.1) 100%
        );
    }
`