import React from 'react';
import styled from 'styled-components';

const BoardContainer = styled.div`
    display: flex;
    gap: 0;
    overflow-x: auto;
    flex: 1;

    /* Style the columns container */
    > div {
        display: flex;
        gap: 24px;
        min-width: fit-content;
        width: 100%;
        height: 100%;
    }
`;

const Column = styled.div`
    flex: 1;
    min-width: 236px;
    max-width: 236px;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: rgb(139, 69, 19);
    border-radius: 8px;
    padding: 16px;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
    box-sizing: border-box;

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
        color: #F5DEB3;
        font-size: 20px;
        font-weight: bold;
        margin: 0 0 16px 0;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
    }
`;

interface CardLabel {
    id: string;
    name: string;
    color: string;
}

interface KanbanCard {
    projectId: string;
    contentId: string;
    title: string;
    number: number;
    labels: {
        nodes: CardLabel[];
    };
    content: {
        url: string;
    };
}

interface KanbanColumn {
    id: string;
    title: string;
    cards: KanbanCard[];
}

interface KanbanBoardProps {
    columns: KanbanColumn[];
    renderCard: (card: KanbanCard) => React.ReactNode;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
    columns,
    renderCard
}) => {
    return (
        <BoardContainer>
            <div>
                {columns.map(column => (
                    <Column key={column.id} data-title={`${column.title} (${column.cards.length})`}>
                        <div>
                            {column.cards.map(card => (
                                <div key={`${card.projectId}-${card.contentId}`}>
                                    {renderCard(card)}
                                </div>
                            ))}
                        </div>
                    </Column>
                ))}
            </div>
        </BoardContainer>
    );
};

export default KanbanBoard;
