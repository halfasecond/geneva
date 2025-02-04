import styled from 'styled-components';

export const FieldContainer = styled.div<{ loading?: boolean }>`
  padding: 20px;
  background: transparent;
  height: 600px; // Fixed height for consistency
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  position: relative;

  ${props => props.loading && `
    &:after {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(2px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 100;
    }
  `}

  /* Style the react-kanban-board container */
  .react-kanban-board {
    z-index: 0; // Lower z-index than container
    display: flex;
    gap: 0; // Remove default gap
    margin: 0 -20px; // Compensate for parent padding
    padding: 0 20px; // Add padding back
    overflow-x: auto;
    flex: 1; // Take up remaining height
    min-height: 0; // Allow flex child to scroll

    /* Style the columns container */
    > div {
      display: flex;
      gap: 24px; // Consistent gap between columns
      min-width: fit-content;
      width: 100%;
      height: 100%; // Full height

      /* Style react-kanban-column */
      .react-kanban-column {
        flex: 1;
        min-width: 210px;
        max-width: 210px;
        height: 100%; // Full height
        display: flex; // Enable flex layout
        flex-direction: column; // Stack children vertically
        background: #654321; // Dark soil color
        background-image: repeating-linear-gradient(
          45deg,
          #654321,
          #654321 10px,
          #8B4513 10px,
          #8B4513 20px
        );
        border-radius: 8px;
        padding: 16px;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
        overflow-y: auto; // Allow scrolling within column

        /* Column content should align to top */
        > div {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          justify-content: flex-start;
        }

        /* Column header using pseudo-element */
        &::before {
          content: attr(data-title);
          display: block;
          color: #F5DEB3; // Wheat color
          font-size: 20px;
          font-weight: bold;
          margin: 0 0 16px 0;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        }

        /* Hover effect */
        &:hover {
          background-image: repeating-linear-gradient(
            45deg,
            #654321,
            #654321 8px,
            #8B4513 8px,
            #8B4513 16px
          );
          transition: background-image 0.3s ease;
        }
      }
    }
  }
`;

export const IssueCard = styled.div`
  background: #F5DEB3; // Wheat color
  border: 2px solid #654321;
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
  width: 178px; // Fixed width (85% of lane width to account for padding)
  flex-shrink: 0; // Prevent cards from shrinking
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
  }
`;

export const IssueTitle = styled.h3`
  color: #2C1810;
  font-size: 16px;
  margin: 0 0 8px 0;
`;

export const IssueLabels = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 8px;
`;

export const Label = styled.span<{ color: string }>`
  background: ${props => props.color};
  color: #fff;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

export const FieldHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 8px;
`;

export const FieldTitle = styled.h2`
  color: #2C1810;
  font-size: 28px;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

export const LoadingSpinner = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 101;
  width: 50px;
  height: 50px;
  border: 4px solid #F5DEB3;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }
`;

export const LoadingText = styled.div`
  position: absolute;
  top: calc(50% + 40px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 101;
  color: #F5DEB3;
  font-size: 20px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
`;
