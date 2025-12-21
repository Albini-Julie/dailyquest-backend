import { Server } from 'socket.io';
import http from 'http';

let ioInstance: Server | null = null;

/**
 * Initialise Socket.IO avec le serveur HTTP
 * @param server HTTP server (createServer(app))
 */
export const initIO = (server: http.Server) => {
  if (ioInstance) return ioInstance; // éviter double initialisation

  ioInstance = new Server(server, {
    cors: { origin: '*' },
    transports: ['websocket'],
  });

  ioInstance.on('connection', (socket) => {
    //console.log('Client WebSocket connecté :', socket.id);

    socket.on('disconnect', () => {
      //console.log('Client WebSocket déconnecté :', socket.id);
    });
  });

  return ioInstance;
};

/**
 * Récupère l'instance Socket.IO
 */
export const getIO = (): Server => {
  if (!ioInstance) throw new Error('Socket.IO non initialisé !');
  return ioInstance;
};
