/* eslint import/no-dynamic-require: "off" */
/* eslint global-require: "off" */
import * as path from 'path';
// @ts-ignore
import babelRegister from '@babel/register';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

const OPTIONS = {
  doctype: '<!DOCTYPE html>',
  transformViews: true,
  babel: {
    presets: [
      '@babel/preset-react',
      [
        '@babel/preset-env',
        {
          targets: {
            node: 'current',
          },
        },
      ],
    ],
  },
  views: path.resolve(__dirname, '..', 'views'),
};

let registered = false;

export const renderViewToMarkup = (filename: string, options?: any): string => {
  if (OPTIONS.transformViews && !registered) {
    babelRegister({
      only: ([] as string[]).concat(OPTIONS.views),
      ...OPTIONS.babel,
    });
    registered = true;
  }

  let markup = OPTIONS.doctype;
  let component = require(path.join(OPTIONS.views, filename));
  component = component.default || component;
  markup += ReactDOMServer.renderToStaticMarkup(React.createElement(component, options));

  return markup;
};
