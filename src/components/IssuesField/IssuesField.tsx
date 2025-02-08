import React, { useEffect, useState, useCallback, useRef } from 'react';
import Board from '@asseinfo/react-kanban';
import {
    FieldContainer,
    IssueCard,
    IssueTitle,
    IssueLabels,
    Label,
    FieldHeader,
    FieldTitle,
    LoadingSpinner,
    LoadingText
} from './IssuesField.style';
import StaticIssuesField from './StaticIssuesField';

// Project configuration
const PROJECT_NUMBER = parseInt(import.meta.env.VITE_APP_GITHUB_PROJECT_NUMBER || '1', 10);

// Agent configuration
const AGENT_ID = 'horse21'; // Using Horse #21 as the lead developer

// Environment configuration - handle various falsy values
const IS_SERVERLESS = import.meta.env.VITE_SERVERLESS?.toLowerCase() === 'true';

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

interface KanbanBoard {
    columns: KanbanColumn[];
}

const DynamicIssuesField: React.FC = () => {
    const [board, setBoard] = useState<KanbanBoard | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);

    // Custom card component with agent labels
    const renderCard = useCallback((card: KanbanCard) => (
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
    ), []);

    // Custom column component
    const renderColumn = useCallback((column: KanbanColumn) => (
        <div data-title={`${column.title} (${column.cards.length})`}>
            {column.cards.map(card => (
                <div key={`${card.projectId}-${card.contentId}`}>
                    {renderCard(card)}
                </div>
            ))}
        </div>
    ), [renderCard]);

    // Fetch project items
    const fetchProjectItems = useCallback(async () => {
        if (!PROJECT_NUMBER) {
            setError('GitHub project configuration missing. Please check your environment variables.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            
            const response = await fetch(`/api/github/projects/${PROJECT_NUMBER}/board`, {
                headers: {
                    'x-agent-id': AGENT_ID,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to fetch board data');
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error?.message || 'Unknown error');
            }

            if (!mountedRef.current) return;

            setBoard(data.data);
            setError(null);
        } catch (err) {
            if (mountedRef.current) {
                setError('Failed to load project items. Please check your GitHub token and permissions.');
                console.error('Error fetching project items:', err);
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        fetchProjectItems();
        const interval = setInterval(fetchProjectItems, 90000); // Refresh every 90 seconds
        return () => {
            mountedRef.current = false;
            clearInterval(interval);
        };
    }, [fetchProjectItems]);

    if (error) {
        return (
            <FieldContainer loading={false}>
                <LoadingText>
                    🚫 {error}
                </LoadingText>
            </FieldContainer>
        );
    }

    if (!board) {
        return (
            <FieldContainer loading={true}>
                <LoadingSpinner />
                <LoadingText>Loading field data...</LoadingText>
            </FieldContainer>
        );
    }

    return (
        <FieldContainer loading={loading}>
            <FieldHeader>
                <FieldTitle>🚜 Issue Tractor</FieldTitle>
            </FieldHeader>
            <Board
                disableColumnDrag
                renderCard={renderCard}
                renderColumn={renderColumn}
            >
                {board}
            </Board>
        </FieldContainer>
    );
};

// Main component that conditionally renders serverless or dynamic version
const IssuesField: React.FC = () => {
    console.log('VITE_SERVERLESS:', import.meta.env.VITE_SERVERLESS);
    return IS_SERVERLESS ? <StaticIssuesField /> : <DynamicIssuesField />;
};

export default React.memo(IssuesField);
