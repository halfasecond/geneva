import axios from 'axios';
import dotenv from 'dotenv';
import express, { Router, Request, Response } from 'express';
import { Models } from './index';
dotenv.config();

const { GROK_TOKEN } = process.env;

const routes = (Models: Models): Router => {
    const router = express.Router();
    async function scrapeGrokThread(postIdOrUrl: string, fromDate?: string, toDate?: string) {
        const API_KEY = GROK_TOKEN;  // Replace with your key if not using env
        const BASE_URL = 'https://api.x.ai/v1/chat/completions';

        let dateFilter = '';
        if (fromDate || toDate) {
            dateFilter = `Only include posts from ${fromDate || 'the start'} to ${toDate || 'now'}. Use date filters like since:${fromDate} until:${toDate} in tools.`;
        }

        try {
            const response = await axios.post(BASE_URL, {
                model: 'grok-4',
                messages: [{
                    role: 'user',
                    content: `Fetch the X thread for this post: ${postIdOrUrl} (ID: ${postIdOrUrl.match(/\d+$/)?.[0] || 'extracted'}). ${dateFilter}

**Output format**:
- Thread title/summary
- Number of posts
- Full chronological content (user, text, media links)
- Key replies/context
- JSON at end for easy parsing.

Use your tools like x_thread_fetch, x_keyword_search (with conversation_id, filter:self_threads, from:user if needed). Be thorough but limit to the specified dates!`
                }],
                temperature: 0.1,  // Low for factual accuracy
                max_tokens: 8192,  // Enough for long threads; adjust if needed
                stream: false
            }, {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            const threadContent = response.data.choices[0].message.content;
            console.log('🧵 Full Thread:\n', threadContent);
            return threadContent;
        } catch (error) {
            console.error('Error:', error.response?.data || error.message);
        }
    }

    // Usage examples:
    // Full thread (no date limit)
    // scrapeGrokThread('1983204375896916021');

    // Limited to recent posts (e.g., last month for testing)
    scrapeGrokThread('72e78659-ae58-43d0-826d-bba26103f49c', '2025-10-05', '2025-10-05');

    return router;
}

export default routes;





