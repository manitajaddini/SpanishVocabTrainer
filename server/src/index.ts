import express from 'express';
import cors from 'cors';
import { handleEvaluate, handleGenerate } from './openai.js';
import { evaluateRequestSchema, generateRequestSchema } from './schemas.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const validate = <T>(schema: { parse: (input: unknown) => T }) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({ error: 'Invalid request payload' });
    }
  };

app.post('/api/generate', validate(generateRequestSchema), handleGenerate);
app.post('/api/evaluate', validate(evaluateRequestSchema), handleEvaluate);

const port = process.env.PORT ?? 3001;

if (process.env.VERCEL !== '1') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;
