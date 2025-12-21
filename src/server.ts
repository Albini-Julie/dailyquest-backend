import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import path from 'path';

import { initIO } from './socket/socket';
import authRoutes from './modules/module-user/authRoutes';
import userQuestRoutes from './modules/module-userQuest/userQuestRoutes';
import communityRoutes from './modules/module-community/communityRoutes';
import questsRoutes from './modules/module-quest/questRoutes';

dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middlewares
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/userquests', userQuestRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/quests', questsRoutes);

// Connexion Mongo et lancement serveur
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;

  mongoose
    .connect(process.env.MONGO_URI || '')
    .then(() => {
      // Initialise Socket.IO après avoir créé le serveur HTTP
      initIO(httpServer);

      httpServer.listen(PORT, () =>
        console.log(`Server running on port ${PORT}`)
      );
    })
    .catch((err) => console.error(err));
}

export default app;
