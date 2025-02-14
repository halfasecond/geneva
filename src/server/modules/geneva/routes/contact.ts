import axios from 'axios';
import express, { Router, Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();

const { SLACK_WEBHOOK_URL } = process.env


const slackWebhookUrl = SLACK_WEBHOOK_URL

interface ContactFormData {
    name: string;
    company?: string;
    project?: string;
    role?: string;
    email: string;
    enquiry?: string;
    message?: string;
    relationship?: string;
    type?: string;
}

const routes = (): Router => {
    const router = express.Router();
    
    router.post('/', async (req: Request<{}, {}, ContactFormData>, res: Response) => {
        const { name, company, project, role, email, enquiry, message, relationship, type } = req.body;
        let slackMessage: { text: string };
        if (slackWebhookUrl) {
            slackMessage = {
                text: `*New contact form submission:*\n\n*Name:* ${name}\n*Company:* ${company}\n*Project:* ${project}\n*Role:* ${role}\n*Email:* ${email}\n*Enquiry:* ${enquiry}`
            };

            try {
                const response = await axios.post(slackWebhookUrl, slackMessage, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.status !== 200) {
                    throw new Error('Failed to send message to Slack');
                }

                res.status(200).json({ message: 'Contact form submitted successfully.' });
            } catch (error: any) {
                console.error('Error sending message to Slack:', error);
                res.status(500).json({ error: 'Failed to submit contact form.' });
            }
        }
    });

    return router;
};

export default routes;
