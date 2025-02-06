# Testing Guide for GitHub Integration

## Overview
This guide explains how to test the GitHub integration API endpoints. The tests use Jest and Supertest to verify both public and protected endpoints.

## Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode (useful during development)
yarn test:watch

# Run tests with coverage report
yarn test:coverage
```

## Test Structure

### 1. Public Endpoints
- GET /api/github/projects/:projectNumber/board
  - Returns board data without requiring agent authentication
  - Handles invalid project numbers
- GET /api/github/projects
  - Lists available projects
  - No authentication required

### 2. Protected Endpoints
All protected endpoints require the `x-agent-id` header.

- POST /api/github/issues
  - Creates new issues
  - Requires project metadata
  - Validates issue types
- POST /api/github/issues/:issueNumber/status
  - Updates issue status
  - Validates status values
- POST /api/github/pulls
  - Creates pull requests
  - Links to issues
  - Handles project metadata

### 3. Error Handling
- Missing agent header
- Invalid issue types
- GitHub API errors
- Validation errors

## Adding New Tests

1. Create test file in `__tests__` directory
2. Import required dependencies:
```typescript
import { jest, describe, expect, it, beforeEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';
```

3. Mock dependencies:
```typescript
jest.mock('../../../utils/github/client');
```

4. Structure tests:
```typescript
describe('Feature Name', () => {
    let app: express.Application;
    let mockClient: jest.Mocked<GitHubClient>;

    beforeEach(() => {
        // Setup
    });

    it('should do something', async () => {
        // Test
    });
});
```

## Best Practices

1. **Mock External Dependencies**
   - Always mock the GitHub client
   - Use jest.mock() for dependencies
   - Provide type-safe mock responses

2. **Test Error Cases**
   - Missing headers
   - Invalid input
   - API errors
   - Edge cases

3. **Verify Responses**
   - Check status codes
   - Validate response structure
   - Verify success/error flags
   - Check data content

4. **Test Coverage**
   - Aim for high coverage
   - Test all endpoints
   - Include error scenarios
   - Test validation rules

## Example Test

```typescript
describe('POST /issues', () => {
    it('should create an issue with valid agent header', async () => {
        mockClient.getProjectMetadata.mockResolvedValue({
            repositoryId: 'repo1',
            projectId: 'proj1',
            statusFieldId: 'status1',
            statusOptionIds: {
                todo: 'todo1',
                inProgress: 'progress1',
                inReview: 'review1',
                done: 'done1'
            }
        });

        const response = await request(app)
            .post('/api/github/issues')
            .set('x-agent-id', 'horse88')
            .send({
                type: 'feat',
                description: 'Test Issue',
                body: 'Test body',
                projectNumber: 1
            })
            .expect('Content-Type', /json/)
            .expect(201);

        expect(response.body.success).toBe(true);
        expect(mockClient.createIssue).toHaveBeenCalledWith({
            title: '[feat] Test Issue',
            body: 'Test body',
            repositoryId: 'repo1'
        });
    });
});
```

## Troubleshooting

1. **Test Environment**
   - Ensure Jest is configured properly
   - Check TypeScript settings
   - Verify mock implementations

2. **Common Issues**
   - Missing type definitions
   - Incorrect mock setup
   - Async test timing
   - Type errors in tests

3. **Debug Tips**
   - Use console.log in tests
   - Check mock calls
   - Verify response structures
   - Use Jest --verbose flag

Remember: Good tests help maintain code quality and catch issues early. Take time to write comprehensive tests for new features and bug fixes.