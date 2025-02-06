import express, { Application } from 'express';
import { Connect } from 'vite';
import { GitHubClient } from '../../utils/github/client';
import { createGitHubRouter } from './routes';

const REQUIRED_ENV_VARS = [
    'GITHUB_TOKEN',
    'GITHUB_OWNER',
    'GITHUB_REPO'
] as const;

/**
 * Check if all required environment variables are present
 */
function hasRequiredEnvVars(): boolean {
    return REQUIRED_ENV_VARS.every(envVar => !!process.env[envVar]);
}

/**
 * Set up GitHub API routes on the provided middleware
 */
export function setupGitHubServer(middleware: Connect.Server) {
    // Check for required environment variables
    if (!hasRequiredEnvVars()) {
        const missing = REQUIRED_ENV_VARS.filter(envVar => !process.env[envVar]);
        console.warn('⚠️ GitHub API server disabled. Missing environment variables:', missing.join(', '));
        console.warn('i️  Copy .env.example to .env and fill in the required values to enable GitHub integration.');
        return;
    }

    try {
        // Initialize GitHub client
        const client = new GitHubClient({
            token: process.env.GITHUB_TOKEN!,
            owner: process.env.GITHUB_OWNER!,
            repo: process.env.GITHUB_REPO!
        });

        // Create Express app for GitHub routes
        const app = express();

        // Add basic middleware
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));

        // Create and mount router
        const router = createGitHubRouter(client);
        app.use('/api/github', router);

        // Mount the Express app on the Connect middleware
        middleware.use(app);

        // Log successful setup
        console.log('🐎 GitHub API server mounted at /api/github');
        console.log(`🐎 Connected to ${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}`);
    } catch (error) {
        console.error('❌ Failed to set up GitHub API server:', error);
        console.warn('⚠️ GitHub integration will be disabled');
    }
}

// Re-export types and utilities
export * from './types';
export * from './errors';