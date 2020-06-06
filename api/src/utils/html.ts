import * as sanitizeHtml from 'sanitize-html';

const sanitiseHtmlConfig: sanitizeHtml.IOptions = Object.assign(sanitizeHtml.defaults, {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'img',
  ]),
});

function cleanHtml(raw: string): string {
  return sanitizeHtml(raw, sanitiseHtmlConfig);
}

export default cleanHtml;
