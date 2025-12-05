/**
 * UNO game constants
 */

import { CardColor, CardValue } from './types';

/**
 * Standard UNO card colors (excluding wild)
 */
export const CARD_COLORS: CardColor[] = ['red', 'blue', 'green', 'yellow'];

/**
 * Action cards available in UNO
 */
export const ACTION_CARDS: CardValue[] = ['skip', 'reverse', 'draw2'];

/**
 * Default number of cards dealt to each player
 */
export const INITIAL_HAND_SIZE = 7;

/**
 * Number of each number card (0 has 1 per color, 1-9 have 2 per color)
 */
export const NUMBER_CARD_COUNTS = {
  '0': 1,
  '1-9': 2,
};

/**
 * Number of each action card per color
 */
export const ACTION_CARD_COUNT_PER_COLOR = 2;

/**
 * Number of each wild card type in the deck
 */
export const WILD_CARD_COUNT = 4;
