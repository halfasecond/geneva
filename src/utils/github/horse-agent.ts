import { GitHubClient } from './client.js';
import { ProjectItemStatus, CreateIssueInput, CreatePullRequestInput } from './types.js';

/**
 * Helper class for Horse agents to interact with GitHub
 */
export class HorseAgent {
  private client: GitHubClient;
  private horseNumber: number;

  constructor(client: GitHubClient, horseNumber: number) {
    this.client = client;
    this.horseNumber = horseNumber;
  }

  /**
   * Format a commit or PR title with horse attribution
   */
  private formatTitle(type: string, description: string, issueNumber?: number): string {
    const issue = issueNumber ? ` (#${issueNumber})` : '';
    return `[Horse #${this.horseNumber}] ${type}: ${description}${issue}`;
  }

  /**
   * Sign a message with horse attribution
   */
  private sign(message: string): string {
    return `${message}\n\n~ Chained Horse #${this.horseNumber} 🐎`;
  }

  /**
   * Create an issue with horse attribution
   */
  async createIssue(
    type: string,
    description: string,
    body: string,
    labelIds?: string[]
  ) {
    const input: CreateIssueInput = {
      title: this.formatTitle(type, description),
      body: this.sign(body),
      repositoryId: (await this.client.getProjectMetadata()).repositoryId,
      labelIds
    };

    const result = await this.client.createIssue(input);
    return result;
  }

  /**
   * Create a PR with horse attribution
   */
  async createPullRequest(
    type: string,
    description: string,
    body: string,
    headBranch: string,
    baseBranch: string = 'master',
    issueNumber?: number
  ) {
    const input: CreatePullRequestInput = {
      title: this.formatTitle(type, description, issueNumber),
      body: this.sign(body),
      repositoryId: (await this.client.getProjectMetadata()).repositoryId,
      headRefName: headBranch,
      baseRefName: baseBranch
    };

    const result = await this.client.createPullRequest(input);
    return result;
  }

  /**
   * Move an issue to a new status
   */
  async moveIssue(issueNumber: number, status: ProjectItemStatus) {
    return this.client.moveIssueToStatus(issueNumber, status);
  }

  /**
   * Create a PR and move the associated issue to review
   */
  async createPullRequestForIssue(
    type: string,
    description: string,
    body: string,
    issueNumber: number,
    headBranch: string,
    baseBranch: string = 'master'
  ) {
    const pr = await this.createPullRequest(
      type,
      description,
      body,
      headBranch,
      baseBranch,
      issueNumber
    );

    await this.moveIssue(issueNumber, ProjectItemStatus.IN_REVIEW);

    return pr;
  }
}