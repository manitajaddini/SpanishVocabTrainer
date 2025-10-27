import type { LemmaQueueState } from '../types';

const shuffle = <T>(items: T[]): T[] => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const createInitialQueue = (lemmas: string[], previous?: LemmaQueueState | null): LemmaQueueState => {
  if (previous && arraysEqual(previous.lemmas, lemmas) && previous.queue.length === lemmas.length) {
    return previous;
  }
  const queue = shuffle(lemmas);
  return {
    lemmas,
    queue,
    cursor: 0,
    usedSet: []
  };
};

const arraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
};

export const getCurrentLemma = (state: LemmaQueueState): string | null => {
  if (state.cursor >= state.queue.length) {
    return null;
  }
  return state.queue[state.cursor];
};

export const markLemmaUsed = (state: LemmaQueueState, lemma: string): LemmaQueueState => {
  if (state.queue[state.cursor] !== lemma) {
    const index = state.queue.indexOf(lemma);
    if (index === -1) return state;
    const queue = [...state.queue];
    queue.splice(index, 1);
    queue.splice(state.cursor, 0, lemma);
    return markLemmaUsed({ ...state, queue }, lemma);
  }
  const usedSet = Array.from(new Set([...state.usedSet, lemma]));
  return {
    ...state,
    cursor: state.cursor + 1,
    usedSet
  };
};

export const skipCurrentLemma = (state: LemmaQueueState): LemmaQueueState => {
  if (state.cursor >= state.queue.length) {
    return state;
  }
  const queue = [...state.queue];
  const [current] = queue.splice(state.cursor, 1);
  queue.push(current);
  return {
    ...state,
    queue
  };
};

export const isExhausted = (state: LemmaQueueState): boolean => state.usedSet.length >= state.lemmas.length;

export const reshuffle = (lemmas: string[]): LemmaQueueState => {
  const queue = shuffle(lemmas);
  return {
    lemmas,
    queue,
    cursor: 0,
    usedSet: []
  };
};
