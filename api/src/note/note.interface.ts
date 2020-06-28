enum ContentType {
  HTML = 'html',
  MarkDown = 'markdown',
}

export interface Note {
  title: string;
  content: string;
  contentType: ContentType,
  drawings: string[];
  created: Date;
  updated: Date;
}
