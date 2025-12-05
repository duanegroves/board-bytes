import { Card, CardColor, CardValue, UnoPlayer, GameState } from './types';
import { CARD_COLORS, ACTION_CARDS, INITIAL_HAND_SIZE } from './constants';
import { IGame, IGameMetadata } from '../../core/interfaces/IGame';
import { Player } from '../../core/room/types';
import {
  PlayerNotFoundError,
  InvalidTurnError,
  InvalidMoveError,
  InvalidPlayerCountError,
} from '../../core/errors/GameErrors';

export class UnoGame implements IGame {
  // Static metadata about UNO
  static readonly metadata: IGameMetadata = {
    name: 'UNO',
    minPlayers: 2,
    maxPlayers: 10,
    description: 'Classic card matching game',
  };

  public roomId: string;
  public players: UnoPlayer[];
  public deck: Card[];
  public discardPile: Card[];
  public currentPlayerIndex: number;
  public direction: number;
  public currentColor: CardColor | null;
  public drawnThisTurn: boolean;

  constructor(roomId: string, players: Player[]) {
    // Validate player count - game enforces its own requirements
    if (players.length < UnoGame.metadata.minPlayers) {
      throw new InvalidPlayerCountError(
        `UNO requires at least ${UnoGame.metadata.minPlayers} players (currently ${players.length})`
      );
    }

    if (players.length > UnoGame.metadata.maxPlayers) {
      throw new InvalidPlayerCountError(
        `UNO supports maximum ${UnoGame.metadata.maxPlayers} players (currently ${players.length})`
      );
    }

    this.roomId = roomId;
    this.players = players as UnoPlayer[]; // Reference to room's player array
    this.currentPlayerIndex = 0;
    this.direction = 1; // 1 for clockwise, -1 for counter-clockwise
    this.currentColor = null;
    this.drawnThisTurn = false;

    // Initialize game-specific player data
    this.players.forEach((player) => {
      player.hand = [];
      player.calledUno = false;
    });

    // Initialize and start the game
    this.deck = [];
    this.discardPile = [];
    this.createDeck();
    this.dealCards();
  }

  private createDeck(): void {
    this.deck = [];

    // Number cards (0 has 1 per color, 1-9 have 2 per color)
    CARD_COLORS.forEach((color) => {
      this.deck.push({ color, value: '0', type: 'number' });

      for (let i = 1; i <= 9; i++) {
        const value = String(i) as CardValue;
        this.deck.push({ color, value, type: 'number' });
        this.deck.push({ color, value, type: 'number' });
      }
    });

    // Action cards (2 per color)
    CARD_COLORS.forEach((color) => {
      ACTION_CARDS.forEach((action) => {
        this.deck.push({ color, value: action, type: 'action' });
        this.deck.push({ color, value: action, type: 'action' });
      });
    });

    // Wild cards (4 of each)
    for (let i = 0; i < 4; i++) {
      this.deck.push({ color: 'wild', value: 'wild', type: 'wild' });
      this.deck.push({ color: 'wild', value: 'wild4', type: 'wild' });
    }

    this.shuffleDeck();
  }

  private shuffleDeck(): void {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  private dealCards(): void {
    // Deal cards to each player
    this.players.forEach((player) => {
      if (!player.hand) player.hand = [];
      for (let i = 0; i < INITIAL_HAND_SIZE; i++) {
        const card = this.deck.pop();
        if (card) player.hand!.push(card);
      }
    });

    // Place first card on discard pile (make sure it's not a wild)
    let firstCard: Card | undefined;
    do {
      firstCard = this.deck.pop();
    } while (firstCard && firstCard.type === 'wild');

    if (firstCard) {
      this.discardPile.push(firstCard);
      this.currentColor = firstCard.color;

      // Handle special first card
      if (firstCard.value === 'skip') {
        this.currentPlayerIndex = 1 % this.players.length;
      } else if (firstCard.value === 'reverse' && this.players.length === 2) {
        // In 2-player game, reverse acts like skip
        this.currentPlayerIndex = 1;
      } else if (firstCard.value === 'reverse') {
        this.direction = -1;
        this.currentPlayerIndex = this.players.length - 1;
      } else if (firstCard.value === 'draw2') {
        const card1 = this.deck.pop();
        const card2 = this.deck.pop();
        if (card1) this.players[1].hand!.push(card1);
        if (card2) this.players[1].hand!.push(card2);
        this.currentPlayerIndex = 2 % this.players.length;
      }
    }
  }

  drawCard(playerId: string): Card {
    const playerIndex = this.players.findIndex((p) => p.id === playerId);

    if (playerIndex === -1) {
      throw new PlayerNotFoundError();
    }

    // Check if player is disconnected
    if (this.players[playerIndex].disconnected) {
      throw new InvalidTurnError('Player is disconnected');
    }

    if (playerIndex !== this.currentPlayerIndex) {
      throw new InvalidTurnError();
    }

    if (this.drawnThisTurn) {
      throw new InvalidMoveError('Already drew a card this turn');
    }

    if (this.deck.length === 0) {
      this.reshuffleDiscardPile();
    }

    const card = this.deck.pop();
    if (!card) {
      throw new InvalidMoveError('No cards available');
    }

    this.players[playerIndex].hand!.push(card);
    this.drawnThisTurn = true;
    return card;
  }

  /**
   * Pass turn after drawing a card
   * Can only be called if player has already drawn this turn
   */
  passTurn(playerId: string): void {
    const playerIndex = this.players.findIndex((p) => p.id === playerId);

    if (playerIndex === -1) {
      throw new PlayerNotFoundError();
    }

    if (playerIndex !== this.currentPlayerIndex) {
      throw new InvalidTurnError();
    }

    if (!this.drawnThisTurn) {
      throw new InvalidMoveError('Must draw a card before passing');
    }

    // Reset draw flag and move to next player
    this.drawnThisTurn = false;
    this.nextPlayer();
  }

  canPlayCard(card: Card): boolean {
    const topCard = this.discardPile[this.discardPile.length - 1];

    // Wild cards can always be played
    if (card.type === 'wild') {
      return true;
    }

    // Check if color or value matches
    if (card.color === this.currentColor || card.value === topCard.value) {
      return true;
    }

    return false;
  }

  playCard(
    playerId: string,
    cardIndex: number,
    chosenColor?: CardColor
  ): { card: Card; winner?: string } {
    const playerIndex = this.players.findIndex((p) => p.id === playerId);

    if (playerIndex === -1) {
      throw new PlayerNotFoundError();
    }

    const player = this.players[playerIndex];

    // Check if player is disconnected
    if (player.disconnected) {
      throw new InvalidTurnError('Player is disconnected');
    }

    if (playerIndex !== this.currentPlayerIndex) {
      throw new InvalidTurnError();
    }

    const card = player.hand![cardIndex];

    if (!card) {
      throw new InvalidMoveError('Invalid card index');
    }

    if (!this.canPlayCard(card)) {
      throw new InvalidMoveError('Cannot play this card');
    }

    // Remove card from hand and add to discard pile
    player.hand!.splice(cardIndex, 1);
    this.discardPile.push(card);

    // Handle wild cards
    if (card.type === 'wild') {
      if (!chosenColor || !CARD_COLORS.includes(chosenColor)) {
        // Put card back if no valid color chosen
        player.hand!.splice(cardIndex, 0, card);
        this.discardPile.pop();
        throw new InvalidMoveError('Must choose a valid color for wild card');
      }
      this.currentColor = chosenColor;
    } else {
      this.currentColor = card.color;
    }

    // Check for win
    if (player.hand!.length === 0) {
      return { card, winner: player.name };
    }

    // Reset UNO call status if player has more than 1 card again
    if (player.hand!.length > 1) {
      player.calledUno = false;
    }

    // Apply card effects and move to next player
    this.applyCardEffect(card);

    return { card };
  }

  private applyCardEffect(card: Card): void {
    this.drawnThisTurn = false;

    if (card.value === 'skip') {
      this.nextPlayer();
      this.nextPlayer();
    } else if (card.value === 'reverse') {
      if (this.players.length === 2) {
        // In 2-player, reverse acts like skip
        this.nextPlayer();
        this.nextPlayer();
      } else {
        this.direction *= -1;
        this.nextPlayer();
      }
    } else if (card.value === 'draw2') {
      this.nextPlayer();
      const targetPlayer = this.players[this.currentPlayerIndex];
      for (let i = 0; i < 2; i++) {
        if (this.deck.length === 0) this.reshuffleDiscardPile();
        const drawnCard = this.deck.pop();
        if (drawnCard) targetPlayer.hand!.push(drawnCard);
      }
      this.nextPlayer();
    } else if (card.value === 'wild4') {
      this.nextPlayer();
      const targetPlayer = this.players[this.currentPlayerIndex];
      for (let i = 0; i < 4; i++) {
        if (this.deck.length === 0) this.reshuffleDiscardPile();
        const drawnCard = this.deck.pop();
        if (drawnCard) targetPlayer.hand!.push(drawnCard);
      }
      this.nextPlayer();
    } else {
      this.nextPlayer();
    }
  }

  private nextPlayer(): void {
    this.currentPlayerIndex =
      (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
  }

  callUno(playerId: string): void {
    const player = this.players.find((p) => p.id === playerId);
    if (!player) {
      throw new PlayerNotFoundError();
    }

    if (player.hand!.length !== 1) {
      throw new InvalidMoveError('Can only call UNO with 1 card');
    }

    player.calledUno = true;
  }

  catchUnoFailure(targetId: string): string {
    const target = this.players.find((p) => p.id === targetId);
    if (!target) {
      throw new PlayerNotFoundError('Target player not found');
    }

    if (target.hand!.length === 1 && !target.calledUno) {
      // Penalty: draw 2 cards
      for (let i = 0; i < 2; i++) {
        if (this.deck.length === 0) this.reshuffleDiscardPile();
        const card = this.deck.pop();
        if (card) target.hand!.push(card);
      }
      return `${target.name} caught! Drew 2 cards.`;
    }

    throw new InvalidMoveError('Target either called UNO or has more than 1 card');
  }

  private reshuffleDiscardPile(): void {
    if (this.discardPile.length <= 1) return;

    const topCard = this.discardPile.pop();
    this.deck = [...this.discardPile];
    this.discardPile = topCard ? [topCard] : [];
    this.shuffleDeck();
  }

  /**
   * IGame interface implementation
   * Returns UNO-specific game state
   */
  getGameState(): GameState {
    const topCard = this.discardPile[this.discardPile.length - 1];

    return {
      roomId: this.roomId,
      players: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        cardCount: p.hand?.length || 0,
        calledUno: p.calledUno || false,
        disconnected: p.disconnected,
      })),
      currentPlayerIndex: this.currentPlayerIndex,
      topCard: topCard,
      currentColor: this.currentColor || 'wild',
      direction: this.direction,
      deckSize: this.deck.length,
    };
  }

  /**
   * IGame interface implementation
   * Returns player's hand (private state)
   */
  getPlayerPrivateState(playerId: string): Card[] {
    const player = this.players.find((p) => p.id === playerId);
    return player?.hand || [];
  }

  /**
   * @deprecated Use getPlayerPrivateState instead
   */
  getPlayerHand(playerId: string): Card[] {
    return this.getPlayerPrivateState(playerId);
  }
}
