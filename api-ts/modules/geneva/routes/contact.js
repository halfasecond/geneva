import axios from 'axios'
import express from 'express'
const slackWebhookUrl = 'https://hooks.slack.com/services/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'
const jackHollisAward = 'https://hooks.slack.com/services/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'

const routes = () => {
    const router = express.Router()
    router.post('/', async (req, res) => {
        const { name, company, project, role, email, enquiry, message, relationship, type } = req.body;
        let slackMessage
        let endpoint
        if (type === 'jack-hollis-award') {
            slackMessage = {
                text: `*New contact form submission:*\n\n*Name:* ${name}\n*Email:* ${email}\n*Message:* ${message}\n*Relationship:* ${relationship}`
            }
            endpoint = jackHollisAward
        }
        else {
            slackMessage = {
                text: `*New contact form submission:*\n\n*Name:* ${name}\n*Company:* ${company}\n*Project:* ${project}\n*Role:* ${role}\n*Email:* ${email}\n*Enquiry:* ${enquiry}`
            }
            endpoint = slackWebhookUrl
        }
        
    
        try {
            // Refactor fetch to axios
            const response = await axios.post(endpoint, slackMessage, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
    
            if (response.status !== 200) {
                throw new Error('Failed to send message to Slack');
            }
    
            res.status(200).json({ message: 'Contact form submitted successfully.' });
        } catch (error) {
            console.error('Error sending message to Slack:', error);
            res.status(500).json({ error: 'Failed to submit contact form.' });
        }
    });

    return router

}

export default routes