import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth';
import userQuestRoutes from './routes/userQuest';
import validationRoutes from './routes/validation';
import communityRoutes from './routes/community';
import questsRoutes from './routes/quest';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.IO
export const io = new Server(httpServer, {
  cors: { origin: '*' },
});

io.on('connection', (socket) => {
  //console.log('Un utilisateur est connecté:', socket.id);

  socket.on('disconnect', () => {
    //console.log('Utilisateur déconnecté:', socket.id);
  });
});

app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/userquests', userQuestRoutes);
app.use('/api/validation', validationRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/quests', questsRoutes);

// Connexion Mongo et lancement serveur
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  mongoose
    .connect(process.env.MONGO_URI || '')
    .then(() =>
      httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`))
    )
    .catch((err) => console.error(err));
}

export default app;
