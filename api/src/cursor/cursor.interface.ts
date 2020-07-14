export interface Point {
  line: number,
  character: number,
}

export interface Cursor {
  id: string,
  name: string,
  color: string,
  index?: number,
  length?: number,
}
