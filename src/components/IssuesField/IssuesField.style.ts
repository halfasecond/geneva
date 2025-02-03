import styled from 'styled-components';

export const FieldContainer = styled.div`
  padding: 20px;
  background: #654321; // Dark soil color
  min-height: 600px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 20px;

  /* Style the react-kanban-board container */
  > div {
    display: flex;
    gap: 0; // Remove default gap
    margin: 0 -20px; // Compensate for parent padding
    padding: 0 20px; // Add padding back
    overflow-x: auto;

    /* Style the columns container */
    > div {
      display: flex;
      gap: 24px; // Consistent gap between columns
      min-width: fit-content;
      width: 100%;

      /* Make columns equal width */
      > div {
        flex: 1;
        min-width: 280px;
      }
    }
  }
`;

export const TilledLane = styled.div`
  background: #8B4513; // Saddle brown for tilled soil
  background-image: repeating-linear-gradient(
    45deg,
    #8B4513,
    #8B4513 10px,
    #654321 10px,
    #654321 20px
  );
  border-radius: 8px;
  padding: 16px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);

  h2 {
    color: #F5DEB3; // Wheat color
    font-size: 20px;
    margin: 0 0 16px 0;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  }

  /* Add soil texture effect on hover */
  &:hover {
    background-image: repeating-linear-gradient(
      45deg,
      #8B4513,
      #8B4513 8px,
      #654321 8px,
      #654321 16px
    );
    transition: background-image 0.3s ease;
  }
`;

export const IssueCard = styled.div`
  background: #F5DEB3; // Wheat color
  border: 2px solid #654321;
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
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
  color: #F5DEB3;
  font-size: 28px;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

export const LoadingField = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  color: #F5DEB3;
  font-size: 20px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
`;