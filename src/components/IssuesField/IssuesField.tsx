import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import KanbanBoard from './KanbanBoard';

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

    // Fetch project items
    const fetchProjectItems = useCallback(async () => {
        if (!PROJECT_NUMBER) {
            setError('GitHub project configuration missing. Please check your environment variables.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            
            const response = await fetch(`/github/projects/${PROJECT_NUMBER}/board`, {
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
            if (!mountedRef.current) return;

            // Initialize board with themed columns
            const board: KanbanBoard = {
                columns: [
                    { id: 'Todo', title: 'Backlog Field 🌱', cards: [] as KanbanCard[] },
                    { id: 'In Progress', title: 'Growing Field 🌾', cards: [] as KanbanCard[] },
                    { id: 'In Review', title: 'Review Field 🌿', cards: [] as KanbanCard[] },
                    { id: 'Done', title: 'Harvested Field 🌾', cards: [] as KanbanCard[] }
                ]
            };

            // Get items from GraphQL response
            const items = data?.items?.nodes || [];
            
            // Sort items into columns
            items.forEach((item: any) => {
                // Find status field value
                const statusField = item.fieldValues?.nodes?.find(
                    (value: any) => value.field?.name === 'Status'
                );
                
                // Get status from field value
                const status = statusField?.name || 'Todo';
                
                // Find matching column
                const column = board.columns.find(col => col.id === status);
                if (column && item.content) {
                    // Transform item into KanbanCard format
                    const card: KanbanCard = {
                        projectId: item.id,
                        contentId: item.id,
                        title: item.content.title,
                        number: item.content.number,
                        labels: {
                            nodes: (item.content.labels?.nodes || []).map((label: any) => ({
                                id: label.id || label.name,
                                name: label.name,
                                color: label.color || 'f29513'
                            }))
                        },
                        content: {
                            url: item.content.url
                        }
                    };
                    column.cards.push(card);
                }
            });

            setBoard(board);
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
        const interval = setInterval(fetchProjectItems, 90000);
        return () => {
            mountedRef.current = false;
            clearInterval(interval);
        };
    }, [fetchProjectItems]);

    if (error) {
        return (
            <FieldContainer data-loading="false">
                <LoadingText>
                    🚫 {error}
                </LoadingText>
            </FieldContainer>
        );
    }

    if (!board) {
        return (
            <FieldContainer data-loading="true">
                <LoadingSpinner />
                <LoadingText>Loading field data...</LoadingText>
            </FieldContainer>
        );
    }

    return (
        <FieldContainer data-loading={loading.toString()}>
            <FieldHeader>
                <FieldTitle>🚜 Issue Tractor</FieldTitle>
            </FieldHeader>
            <KanbanBoard
                columns={board.columns}
                renderCard={renderCard}
            />
        </FieldContainer>
    );
};

// Main component that conditionally renders serverless or dynamic version
const IssuesField: React.FC = () => {
    return IS_SERVERLESS ? <StaticIssuesField /> : <DynamicIssuesField />;
};

export default IssuesField;
