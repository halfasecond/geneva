import { GitHubClient } from './client.js';

/**
 * Represents an agent in the system that can perform GitHub operations
 */
export class Agent {
  private client: GitHubClient;
  private agentType: string;
  private agentNumber: number;

  constructor(client: GitHubClient, agentType: string, agentNumber: number) {
    this.client = client;
    this.agentType = agentType;
    this.agentNumber = agentNumber;
  }

  /**
   * Create a title for an issue or PR
   */
  private createTitle(type: string, description: string, issueNumber?: number): string {
    const issue = issueNumber ? ` (#${issueNumber})` : '';
    return `[${this.agentType} #${this.agentNumber}] ${type}: ${description}${issue}`;
  }

  /**
   * Sign a message with agent's signature
   */
  private sign(message: string): string {
    return `${message}\n\n~ ${this.agentType} #${this.agentNumber} 🎯`;
  }

  /**
   * Create a new issue
   */
  async createIssue(
    type: string,
    description: string,
    body: string,
    labelIds?: string[],
    projectIds?: string[]
  ) {
    const title = this.createTitle(type, description);
    const signedBody = this.sign(body);

    // Create issue
    const result = await this.client.createIssue({
      repositoryId: process.env.VITE_APP_GITHUB_REPO_ID!,
      title,
      body: signedBody
    });

    // Add all labels using REST API
    const allLabels = [...(labelIds || []), `agent:${this.agentType.toLowerCase()}${this.agentNumber}`];
    await this.client.addLabelsToIssue(
      result.createIssue.issue.number,
      allLabels
    );

    // Add to projects if specified
    if (projectIds?.length) {
      for (const projectId of projectIds) {
        await this.client.addIssueToProject(result.createIssue.issue.id, projectId);
      }
    }

    return result;
  }

  /**
   * Create a pull request for an issue
   */
  async createPullRequestForIssue(
    type: string,
    description: string,
    body: string,
    issueNumber: number,
    headBranch: string,
    baseBranch: string = 'master'
  ) {
    const title = this.createTitle(type, description, issueNumber);
    const signedBody = this.sign(body);

    // Create PR
    const result = await this.client.createPullRequest({
      repositoryId: process.env.VITE_APP_GITHUB_REPO_ID!,
      baseRefName: baseBranch,
      headRefName: headBranch,
      title,
      body: signedBody
    });

    // Add agent label
    await this.client.addLabelsToIssue(
      result.createPullRequest.pullRequest.number,
      [`agent:${this.agentType.toLowerCase()}${this.agentNumber}`]
    );

    return result;
  }

  /**
   * Comment on a pull request
   */
  async commentOnPR(prNumber: number, comment: string) {
    const signedComment = this.sign(comment);
    const pr = await this.client.getPullRequest(prNumber);

    return this.client.addComment({
      subjectId: pr.id,
      body: signedComment
    });
  }
}