/**
 * GitHub Integration Module
 * 
 * This module provides a type-safe interface for interacting with GitHub's GraphQL API,
 * specifically focused on managing issues, pull requests, and project boards.
 * 
 * Key Features:
 * - Type-safe GitHub API client
 * - Project board integration
 * - Horse agent support for automated actions
 * - Issue and PR management
 * 
 * Example Usage:
 * ```typescript
 * // Initialize the client
 * const client = new GitHubClient({
 *   token: process.env.GITHUB_TOKEN,
 *   owner: 'org-name',
 *   repo: 'repo-name',
 *   projectNumber: 1
 * });
 * 
 * // Create a horse agent
 * const horse82 = new HorseAgent(client, 82);
 * 
 * // Create an issue and PR
 * await horse82.createPullRequestForIssue(
 *   'feat',
 *   'Add tilled fields visualization',
 *   'Implementation details...',
 *   1,
 *   'feat/tilled-fields-board'
 * );
 * ```
 * 
 * @module GitHub
 */

export * from './types.js';
export * from './client.js';
export * from './horse-agent.js';

// Re-export commonly used types
export type {
  ProjectMetadata,
  GitHubClientConfig,
  CreateIssueInput,
  CreatePullRequestInput,
  ProjectItem,
  ProjectItemStatus
} from './types.js';

// Re-export main classes
export { GitHubClient } from './client.js';
export { HorseAgent } from './horse-agent.js';