/**
 * Custom error classes for game operations
 * These allow us to distinguish between different types of game errors
 */

export class GameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GameError';
  }
}

export class PlayerNotFoundError extends GameError {
  constructor(message: string = 'Player not found') {
    super(message);
    this.name = 'PlayerNotFoundError';
  }
}

export class InvalidTurnError extends GameError {
  constructor(message: string = 'Not your turn') {
    super(message);
    this.name = 'InvalidTurnError';
  }
}

export class InvalidMoveError extends GameError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMoveError';
  }
}

export class GameAlreadyStartedError extends GameError {
  constructor(message: string = 'Game already in progress') {
    super(message);
    this.name = 'GameAlreadyStartedError';
  }
}

export class InvalidPlayerCountError extends GameError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPlayerCountError';
  }
}
