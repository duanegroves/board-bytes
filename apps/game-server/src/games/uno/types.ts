/**
 * UNO-specific types
 */

import { Player } from '../../core/room/types';

// ========== CARD TYPES ==========

export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';

export type CardValue =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'skip'
  | 'reverse'
  | 'draw2'
  | 'wild'
  | 'wild4';

export type CardType = 'number' | 'action' | 'wild';

export interface Card {
  color: CardColor;
  value: CardValue;
  type: CardType;
}

// ========== PLAYER TYPES ==========

/**
 * UNO-specific player extension
 * These fields are added to the base Player type when game starts
 */
export interface UnoPlayer extends Player {
  hand?: Card[]; // Player's cards
  calledUno?: boolean; // Whether player called UNO
}

/**
 * Public player info (what other players can see)
 */
export interface PlayerPublic {
  id: string;
  name: string;
  cardCount: number;
  calledUno: boolean;
  disconnected: boolean;
}

// ========== GAME STATE ==========

/**
 * UNO game state (public state visible to all players)
 */
export interface GameState {
  roomId: string;
  players: PlayerPublic[];
  currentPlayerIndex: number;
  topCard: Card;
  currentColor: CardColor;
  direction: number;
  deckSize: number;
}

// ========== SOCKET EVENT PAYLOADS ==========

export interface CardPlayData {
  cardIndex: number;
  chosenColor?: CardColor;
}

export interface UnoChallengeData {
  targetId: string;
}
