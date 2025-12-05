import { RoomManager } from '../../../core/room/RoomManager';
import { TypedServer, TypedSocket } from '../../../socket/helpers';
import { registerCardHandlers } from './cardHandlers';
import { registerGameHandlers } from './gameHandlers';
import { registerUnoHandlers } from './unoHandlers';

/**
 * Register all UNO-specific socket handlers
 */
export function registerUnoSocketHandlers(
  io: TypedServer,
  socket: TypedSocket,
  roomManager: RoomManager
): void {
  registerCardHandlers(io, socket, roomManager);
  registerGameHandlers(io, socket, roomManager);
  registerUnoHandlers(io, socket, roomManager);
}
