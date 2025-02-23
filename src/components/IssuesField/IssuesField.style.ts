import styled from 'styled-components';

export const FieldContainer = styled.div`
  padding: 20px;
  background: transparent;
  height: 720px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  position: relative;
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
  background: #${props => props.color};
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
