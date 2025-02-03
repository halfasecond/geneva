import { graphql } from '@octokit/graphql';

const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${process.env.VITE_APP_GITHUB_TOKEN}`,
  },
});

interface ProjectMetadata {
  repositoryId: string;
  projectId: string;
  statusFieldId: string;
  statusOptionIds: {
    todo: string;
    inProgress: string;
    inReview: string;
    done: string;
  };
}

interface StatusOption {
  id: string;
  name: string;
}

interface ProjectField {
  id: string;
  name: string;
  options: StatusOption[];
}

interface GraphQLResponse {
  repository: {
    id: string;
    projectV2: {
      id: string;
      fields: {
        nodes: ProjectField[];
      };
    };
  };
}

export async function getProjectMetadata(
  owner: string,
  repo: string,
  projectNumber: number
): Promise<ProjectMetadata> {
  const query = `
    query($owner: String!, $repo: String!, $projectNumber: Int!) {
      repository(owner: $owner, name: $repo) {
        id
        projectV2(number: $projectNumber) {
          id
          fields(first: 20) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id
                name
                options {
                  id
                  name
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await graphqlWithAuth<GraphQLResponse>(query, {
    owner,
    repo,
    projectNumber,
  });

  const statusField = response.repository.projectV2.fields.nodes.find(
    (field: ProjectField) => field.name === 'Status'
  );

  if (!statusField) {
    throw new Error('Status field not found in project');
  }

  const getOptionId = (name: string): string => {
    const option = statusField.options.find(
      (opt: StatusOption) => opt.name.toLowerCase() === name.toLowerCase()
    );
    if (!option) {
      throw new Error(`Status option "${name}" not found`);
    }
    return option.id;
  };

  return {
    repositoryId: response.repository.id,
    projectId: response.repository.projectV2.id,
    statusFieldId: statusField.id,
    statusOptionIds: {
      todo: getOptionId('Todo'),
      inProgress: getOptionId('In Progress'),
      inReview: getOptionId('In Review'),
      done: getOptionId('Done'),
    },
  };
}