import * as Y from 'yjs';
import tinycolor from 'tinycolor2';

export const messageSync = 0;
export const messageAwarenessUserInfo = 4;
export const messageSyncEnd = 5;

// Colors are the possible colors that a room (note) can assign
// to cursors, if there are more users than this the index should
// reset
export const Colors = Object.freeze([
  '#3cb44b',
  '#e6194b',
  '#ffe119',
  '#4363d8',
  '#f58231',
  '#911eb4',
  '#46f0f0',
  '#f032e6',
  '#bcf60c',
  '#fabebe',
  '#008080',
  '#e6beff',
  '#9a6324',
  '#770000',
  '#aaffc3',
  '#808000',
  '#ffd8b1',
  '#002c5a',
]);

/**
 * 
 * @param {string} str 
 */
export function stringToArray(str) {
  if (!str) {
    return new Uint8Array();
  }
  const ret = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    ret[i] = str.charCodeAt(i);
  }
  return ret
}

/**
 * 
 * @param {Uint8Array} array
 */
export function arrayToString(array) {
  let str = "";
  for (let i = 0; i < array.length; i++) {
    str += String.fromCharCode(parseInt(array[i]));
  }
  return str;
}

export function encodeDoc(doc) {
  return arrayToString(Y.encodeStateAsUpdate(doc));
}

/**
 * 
 * @param {string} str 
 */
export function decodeDoc(str) {
  const doc = new Y.Doc();
  const bytes = stringToArray(str);
  if (bytes.length === 0) {
    return doc;
  }
  Y.applyUpdate(doc, stringToArray(str));
  return doc;
}

export function getTextColorFromBackground(bgColor) {
  return tinycolor(bgColor).getLuminance() > 0.5 ? tinycolor('#000') : tinycolor('#fff');
}
