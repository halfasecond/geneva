import React from 'react';
import Board from '@asseinfo/react-kanban';
import {
    FieldContainer,
    IssueCard,
    IssueTitle,
    IssueLabels,
    Label,
    FieldHeader,
    FieldTitle,
} from './IssuesField.style';

// Demo board data for serverless deployment
const DEMO_BOARD = {
    columns: [
        {
            id: 'todo',
            title: 'To Do',
            cards: [
                {
                    projectId: 'demo-1',
                    contentId: 'demo-1',
                    title: 'Add horse movement speed control UI',
                    number: 59,
                    labels: {
                        nodes: [
                            { id: '1', name: 'agent:horse88', color: '8B4513' },
                            { id: '2', name: 'type:enhancement', color: '84b6eb' },
                            { id: '3', name: 'scope:ui', color: '7057ff' }
                        ]
                    },
                    content: {
                        url: 'https://github.com/your-org/paddock/issues/59'
                    }
                }
            ]
        },
        {
            id: 'in_progress',
            title: 'In Progress',
            cards: [
                {
                    projectId: 'demo-2',
                    contentId: 'demo-2',
                    title: 'Prepare for OneSec deployment',
                    number: 58,
                    labels: {
                        nodes: [
                            { id: '4', name: 'agent:horse88', color: '8B4513' },
                            { id: '5', name: 'type:deployment', color: 'fbca04' }
                        ]
                    },
                    content: {
                        url: 'https://github.com/your-org/paddock/issues/58'
                    }
                }
            ]
        },
        {
            id: 'done',
            title: 'Done',
            cards: [
                {
                    projectId: 'demo-3',
                    contentId: 'demo-3',
                    title: 'Implement horse movement system',
                    number: 42,
                    labels: {
                        nodes: [
                            { id: '6', name: 'agent:horse21', color: '8B4513' },
                            { id: '7', name: 'type:feature', color: '0e8a16' }
                        ]
                    },
                    content: {
                        url: 'https://github.com/your-org/paddock/issues/42'
                    }
                }
            ]
        }
    ]
};

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

const StaticIssuesField: React.FC = () => {
    // Custom card component with agent labels
    const renderCard = (card: KanbanCard) => (
        <IssueCard onClick={() => window.open(card.content.url, '_blank')}>
            <IssueTitle>#{card.number} {card.title}</IssueTitle>
            <IssueLabels>
                {card.labels.nodes.map((label: CardLabel) => {
                    // Special styling for agent labels
                    const isAgentLabel = label.name.startsWith('agent:');
                    return (
                        <Label 
                            key={`${card.contentId}-${label.id}`}
                            color={isAgentLabel ? '#8B4513' : `#${label.color}`}
                        >
                            {isAgentLabel ? `🐎 ${label.name.replace('agent:', '')}` : label.name}
                        </Label>
                    );
                })}
            </IssueLabels>
        </IssueCard>
    );

    // Custom column component
    const renderColumn = (column: KanbanColumn) => (
        <div data-title={`${column.title} (${column.cards.length})`}>
            {column.cards.map(card => (
                <div key={`${card.projectId}-${card.contentId}`}>
                    {renderCard(card)}
                </div>
            ))}
        </div>
    );

    return (
        <FieldContainer loading={false}>
            <FieldHeader>
                <FieldTitle>🚜 Issue Tractor (Serverless Demo)</FieldTitle>
            </FieldHeader>
            <Board
                disableColumnDrag
                renderCard={renderCard}
                renderColumn={renderColumn}
            >
                {DEMO_BOARD}
            </Board>
        </FieldContainer>
    );
};

export default React.memo(StaticIssuesField);