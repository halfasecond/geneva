import { GitHubClient } from './client.js';
import { ProjectItemStatus, CreateIssueInput, CreatePullRequestInput, PullRequest } from './types.js';

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
   * Get or create the agent label
   */
  private async getAgentLabel(): Promise<string> {
    const labelName = `agent:horse${this.horseNumber}`;
    return this.client.getOrCreateLabel(labelName, 'f29513');
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
    // Create issue without agent label
    const input: CreateIssueInput = {
      title: this.formatTitle(type, description),
      body: this.sign(body),
      repositoryId: (await this.client.getProjectMetadata()).repositoryId,
      labelIds: labelIds || []
    };

    const result = await this.client.createIssue(input);

    // Add agent label using REST API
    await this.client.addLabelsToIssue(
      result.createIssue.issue.number,
      [`agent:horse${this.horseNumber}`]
    );

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

  /**
   * Get a pull request with comments
   */
  async getPullRequest(prNumber: number): Promise<PullRequest> {
    return this.client.getPullRequest(prNumber);
  }

  /**
   * Add a comment to a pull request with horse attribution
   */
  async commentOnPR(prNumber: number, comment: string) {
    const pr = await this.getPullRequest(prNumber);
    
    return this.client.addComment({
      subjectId: pr.id,
      body: this.sign(comment)
    });
  }

  /**
   * Review code in a pull request
   */
  async reviewPR(prNumber: number, feedback: string) {
    const reviewComment = `Code Review Feedback:\n\n${feedback}`;
    return this.commentOnPR(prNumber, reviewComment);
  }

  /**
   * Suggest improvements to code in a pull request
   */
  async suggestImprovements(prNumber: number, suggestions: string[]) {
    const comment = `Suggested Improvements:

${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Let me know if you'd like me to help implement any of these suggestions!`;

    return this.commentOnPR(prNumber, comment);
  }
}