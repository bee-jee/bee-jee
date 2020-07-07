import * as Y from 'yjs';

/**
 * 
 * @param {string} str 
 */
export function stringToArray(str) {
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
  Y.applyUpdate(doc, stringToArray(str));
  return doc;
}
