// import express, { Request, Response, Router } from 'express';
// import { Models } from './index';
// import authenticateToken from '../middleware/auth.js';

// const routes = ({ CMS }: Models): Router => {
//     const router = express.Router();

//     router.post('/', authenticateToken, async (req, res) => {
//         const { slug, title, author, publishedDate, contentType, thumbnail, content, tags, published } = req.body;

//         if (!slug || !title || !author || !contentType) {
//             return res.status(400).json({ error: 'Missing required fields' });
//         }

//         // Convert publishedDate to Date object if it's a string
//         const parsedPublishedDate = new Date(publishedDate.replace('000Z', '00Z'));

//         // Check if the parsed date is valid
//         if (isNaN(parsedPublishedDate.getTime())) {
//             return res.status(400).json({ error: 'Invalid publishedDate format' });
//         }

//         try {
//             const copy = new CMS({
//                 slug,
//                 title,
//                 author,
//                 publishedDate: parsedPublishedDate,
//                 contentType,
//                 thumbnail: thumbnail || { src: '', alt: '' },
//                 content: content || [],
//                 tags: tags || [],
//                 published: published || false
//             });

//             const savedCopy = await copy.save();
//             res.status(201).json(savedCopy);
//         } catch (error: any) {
//             console.error('Error saving copy:', error);
//             res.status(400).json({ error: error.message });
//         }
//     });

//     // Get all copies
//     router.get('/', async (req: Request, res: Response) => {
//         try {
//             const { type } = req.query;
//             let filter = {};
//             if (type) {
//                 filter = { contentType: type };
//             }
//             const copies = await CMS.find(filter).sort({ publishedDate: -1 });
//             res.status(200).json(copies);
//         } catch (error: any) {
//             res.status(500).json({ error: error.message });
//         }
//     });

//     // Get a copy by slug
//     router.get('/:slug', async (req: Request, res: Response) => {
//         try {
//             const copy = await CMS.findOne({ slug: req.params.slug });
//             if (!copy) return res.status(404).json({ error: 'Copy not found' });
//             res.status(200).json(copy);
//         } catch (error: any) {
//             res.status(500).json({ error: error.message });
//         }
//     });

//     // Update a copy by ID
//     router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
//         try {
//             const copy = await CMS.findByIdAndUpdate(req.params.id, req.body, { new: true });
//             if (!copy) return res.status(404).json({ error: 'Copy not found' });
//             res.status(200).json(copy);
//         } catch (error: any) {
//             res.status(400).json({ error: error.message });
//         }
//     });

//     // Delete a copy by ID
//     router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
//         try {
//             const copy = await CMS.findByIdAndDelete(req.params.id);
//             if (!copy) return res.status(404).json({ error: 'Copy not found' });
//             res.status(200).json({ message: 'Copy deleted successfully' });
//         } catch (error: any) {
//             res.status(500).json({ error: error.message });
//         }
//     });

//     return router;
// };

// export default routes;
