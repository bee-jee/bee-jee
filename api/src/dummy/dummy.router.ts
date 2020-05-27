import { Request, Response, Router } from 'express';
import * as quotes from './quotes.json';

export const dummyRouter = Router();

dummyRouter.get('/', async (req: Request, res: Response) => {
  const name = req.param('name', 'there');
  const index = Math.floor(Math.random() * (quotes as any).length);
  const quote = (quotes as any)[index];
  res.status(200).send({
    message: `Hello ${name}. Here's a quote for you: ${quote.text} by ${quote.author}`,
  });
});
