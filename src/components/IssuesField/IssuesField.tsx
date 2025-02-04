import React, { useEffect, useState, useCallback, useRef } from 'react';
import Board from '@asseinfo/react-kanban';
import { graphql } from '@octokit/graphql';
import {
  FieldContainer,
  TilledLane,
  IssueCard,
  IssueTitle,
  IssueLabels,
  Label,
  FieldHeader,
  FieldTitle,
  LoadingField
} from './IssuesField.style';

// Initialize GitHub GraphQL client
const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${import.meta.env.VITE_APP_GITHUB_TOKEN}`,
  },
});

// Project configuration
const PROJECT_NUMBER = parseInt(import.meta.env.VITE_APP_GITHUB_PROJECT_NUMBER || '1', 10);
const ORGANIZATION = import.meta.env.VITE_APP_GITHUB_REPO_OWNER;

// Map GitHub's default status fields to our tilled field names
const STATUS_MAPPING = {
  'todo': 'Backlog Field 🌱',
  'in progress': 'Growing Field 🌾',
  'in review': 'Review Field 🌿',
  'done': 'Harvested Field 🌾',
  // Default fallback
  'default': 'Backlog Field 🌱'
} as const;

interface ProjectV2ItemFieldValue {
  name: string;
  field: {
    name: string;
  };
}

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

interface GraphQLResponse {
  organization: {
    projectV2: {
      items: {
        nodes: Array<{
          id: string;
          fieldValues: {
            nodes: ProjectV2ItemFieldValue[];
          };
          content: {
            __typename: string;
            id: string;
            title: string;
            number: number;
            url: string;
            labels: {
              nodes: Array<{
                id: string;
                name: string;
                color: string;
              }>;
            };
          } | null;
        }>;
      };
    };
  };
}

// Define the board structure matching GitHub Project status options
const INITIAL_BOARD: KanbanBoard = {
  columns: [
    {
      id: 'todo',
      title: STATUS_MAPPING['todo'],
      cards: []
    },
    {
      id: 'in-progress',
      title: STATUS_MAPPING['in progress'],
      cards: []
    },
    {
      id: 'in-review',
      title: STATUS_MAPPING['in review'],
      cards: []
    },
    {
      id: 'done',
      title: STATUS_MAPPING['done'],
      cards: []
    }
  ]
};

const IssuesField: React.FC = () => {
  const [board, setBoard] = useState<KanbanBoard>(INITIAL_BOARD);
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
    <TilledLane>
      <h2>{column.title} ({column.cards.length})</h2>
      {column.cards.map(card => (
        <div key={`${card.projectId}-${card.contentId}`}>
          {renderCard(card)}
        </div>
      ))}
    </TilledLane>
  ), [renderCard]);

  // Map GitHub status to column index
  const getColumnIndex = useCallback((status: string): number => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'in progress') return 1;
    if (statusLower === 'in review') return 2;
    if (statusLower === 'done') return 3;
    if (statusLower === 'todo') return 0;
    // Log unknown status for debugging
    console.log('Unknown status:', status);
    return 0; // Default to backlog
  }, []);

  // Fetch project items
  const fetchProjectItems = useCallback(async () => {
    if (!ORGANIZATION || !PROJECT_NUMBER) {
      setError('GitHub project configuration missing. Please check your environment variables.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const query = `
        query($org: String!, $number: Int!) {
          organization(login: $org) {
            projectV2(number: $number) {
              items(first: 100) {
                nodes {
                  id
                  fieldValues(first: 8) {
                    nodes {
                      ... on ProjectV2ItemFieldSingleSelectValue {
                        name
                        field {
                          ... on ProjectV2SingleSelectField {
                            name
                          }
                        }
                      }
                    }
                  }
                  content {
                    __typename
                    ... on Issue {
                      id
                      title
                      number
                      url
                      labels(first: 10) {
                        nodes {
                          id
                          name
                          color
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await graphqlWithAuth<GraphQLResponse>(query, {
        org: ORGANIZATION,
        number: PROJECT_NUMBER
      });

      if (!mountedRef.current) return;

      const items = response.organization.projectV2.items.nodes;
      const newBoard = structuredClone(INITIAL_BOARD);
      const processedKeys = new Set<string>();

      items.forEach(item => {
        // Skip items that don't have content or aren't Issues
        if (!item.content || item.content.__typename !== 'Issue') {
          return;
        }

        // Create a unique key combining project item ID and content ID
        const itemKey = `${item.id}-${item.content.id}`;

        // Skip if we've already processed this combination
        if (processedKeys.has(itemKey)) {
          return;
        }
        processedKeys.add(itemKey);

        const statusNode = item.fieldValues.nodes.find(
          (value: ProjectV2ItemFieldValue) => value?.field?.name === 'Status'
        );
        const status = statusNode?.name || 'Todo';
        
        // Debug log status values
        console.log('Issue #' + item.content.number + ' status:', status);

        const projectItem: KanbanCard = {
          projectId: item.id,
          contentId: item.content.id,
          title: item.content.title,
          number: item.content.number,
          labels: item.content.labels,
          content: {
            url: item.content.url
          }
        };

        // Add to appropriate column based on status
        const columnIndex = getColumnIndex(status);
        newBoard.columns[columnIndex].cards.push(projectItem);
      });

      if (mountedRef.current) {
        setBoard(newBoard);
        setError(null);
      }
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
  }, [getColumnIndex]);

  useEffect(() => {
    mountedRef.current = true;
    fetchProjectItems();
    const interval = setInterval(fetchProjectItems, 30000); // Refresh every 30 seconds
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchProjectItems]);

  if (loading) {
    return (
      <FieldContainer>
        <LoadingField>
          🌱 Tending to the fields...
        </LoadingField>
      </FieldContainer>
    );
  }

  if (error) {
    return (
      <FieldContainer>
        <LoadingField>
          🚫 {error}
        </LoadingField>
      </FieldContainer>
    );
  }

  return (
    <FieldContainer>
      <FieldHeader>
        <FieldTitle>🌾 Issue Fields</FieldTitle>
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

export default React.memo(IssuesField);
