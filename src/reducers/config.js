import { SET_CONFIG } from '../actions/types';

const initialState = {
  explorerSize: 300,
  defaultEditorEditType: 'wysiwyg',
  definitions: [
    {
      type: 'menu',
      name: 'defaultEditorEditType',
      values: ['wysiwyg', 'markdown'],
    },
  ],
};

export default function(state = initialState, action) {
  switch (action.type) {
    case SET_CONFIG: {
      const config = {};
      for (const key in action.payload) {
        if (key in initialState) {
          config[key] = action.payload[key];
        }
      }
      return {
        ...state,
        ...config,
      };
    }
    default:
      return state;
  }
}
