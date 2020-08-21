import { Node, Plugin, NodeSelection } from "tiptap";
import { Decoration, DecorationSet } from 'prosemirror-view';
import { IMAGE } from "./names";
import { setMeta } from "y-prosemirror";
import { relativeCoordsAt } from "../utils/coords";

const CSS_ROTATE_PATTERN = /rotate\(([0-9.]+)rad\)/i;
const EMPTY_CSS_VALUE = new Set(['0%', '0pt', '0px']);
const MIN_SIZE = 20;
const MAX_SIZE = 10000;

const imagePluginKey = 'imagePlugin';

function getAttrs(dom) {
  const { cssFloat, display, marginTop, marginLeft } = dom.style;
  let { width, height } = dom.style;
  let align = dom.getAttribute('data-align') || dom.getAttribute('align');
  if (align) {
    align = /(left|right|center)/.test(align) ? align : null;
  } else if (cssFloat === 'left' && !display) {
    align = 'left';
  } else if (cssFloat === 'right' && !display) {
    align = 'right';
  } else if (!cssFloat && display === 'block') {
    align = 'block';
  }

  width = width || dom.getAttribute('width');
  height = height || dom.getAttribute('height');

  let crop = null;
  let rotate = null;
  const { parentElement } = dom;
  if (parentElement instanceof HTMLElement) {
    // Special case for Google doc's image.
    const ps = parentElement.style;
    if (
      ps.display === 'inline-block' &&
      ps.overflow === 'hidden' &&
      ps.width &&
      ps.height &&
      marginLeft &&
      !EMPTY_CSS_VALUE.has(marginLeft) &&
      marginTop &&
      !EMPTY_CSS_VALUE.has(marginTop)
    ) {
      crop = {
        width: parseInt(ps.width, 10) || 0,
        height: parseInt(ps.height, 10) || 0,
        left: parseInt(marginLeft, 10) || 0,
        top: parseInt(marginTop, 10) || 0,
      };
    }
    if (ps.transform) {
      // example: `rotate(1.57rad) translateZ(0px)`;
      const mm = ps.transform.match(CSS_ROTATE_PATTERN);
      if (mm && mm[1]) {
        rotate = parseFloat(mm[1]) || null;
      }
    }
  }

  return {
    align,
    alt: dom.getAttribute('alt') || null,
    crop,
    height: parseInt(height, 10) || null,
    rotate,
    src: dom.getAttribute('src') || null,
    title: dom.getAttribute('title') || null,
    width: parseInt(width, 10) || null,
  };
}

function setWidth(el, width) {
  el.style.width = width + 'px';
}

function setHeight(el, width, height) {
  el.style.height = height + 'px';
}

function setSize(el, width, height) {
  el.style.width = Math.round(width) + 'px';
  el.style.height = Math.round(height) + 'px';
}

function clamp(min, value, max) {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

const resizeDirection = {
  top_left: setSize,
  top: setHeight,
  top_right: setSize,
  right: setWidth,
  bottom_right: setSize,
  bottom: setHeight,
  bottom_left: setSize,
  left: setWidth,
};

class ResizeBox {
  el = null;
  parent = null;
  imgNode = null;
  imgNodePos = 0;
  view = null;
  active = false;
  x1 = 0;
  y1 = 0;
  x2 = 0;
  y2 = 0;
  direction = '';
  rafId = 0;
  width = 0;
  height = 0;
  targetWidth = 0;
  targetHeight = 0;

  constructor(parent, direction) {
    this.parent = parent;
    this.direction = direction;
    const el = document.createElement('div');
    el.classList.add('resizer-box');
    el.classList.add(direction);
    el.style.width = '5px';
    el.style.height = '5px';
    el.style.position = 'absolute';
    el.style.transform = 'translate(-50%, -50%)';
    el.style.backgroundColor = 'black';
    this.el = el;

    el.addEventListener('mousedown', this.onMouseDown);
  }

  onMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.start(e);
  };

  onMouseUp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.end();
  }

  onMouseMove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.x2 = e.clientX;
    this.y2 = e.clientY;
    this.rafId = requestAnimationFrame(this.syncSize);
  }

  syncSize = () => {
    if (!this.active) {
      return;
    }
    const { parent, direction, width, height } = this;

    const dx = (this.x2 - this.x1) * (/left/.test(direction) ? -1 : 1);
    const dy = (this.y2 - this.y1) * (/top/.test(direction) ? -1 : 1);

    const fn = resizeDirection[direction];
    const aspect = width / height;
    let targetWidth = clamp(MIN_SIZE, width + Math.round(dx), MAX_SIZE);
    let targetHeight = clamp(MIN_SIZE, height + Math.round(dy), MAX_SIZE);

    if (fn === setSize) {
      targetHeight = Math.max(targetWidth / aspect, MIN_SIZE);
      targetWidth = targetHeight * aspect;
    }

    fn(parent, Math.round(targetWidth), Math.round(targetHeight));
    this.targetWidth = targetWidth;
    this.targetHeight = targetHeight;
  };

  start(e) {
    if (this.active) {
      this.end();
    }

    this.active = true;

    const { parent, direction, width, height } = this;
    parent.classList.add(direction);

    this.x1 = e.clientX;
    this.y1 = e.clientY;
    this.x2 = this.x1;
    this.y2 = this.y1;
    this.targetWidth = width;
    this.targetHeight = height;

    document.addEventListener('mousemove', this.onMouseMove, true);
    document.addEventListener('mouseup', this.onMouseUp, true);
  }

  end() {
    if (!this.active) {
      return;
    }

    this.active = false;
    document.removeEventListener('mousemove', this.onMouseMove, true);
    document.removeEventListener('mouseup', this.onMouseUp, true);

    const node = this.imgNode;
    let { tr } = this.view.state;
    tr = tr.setNodeMarkup(this.imgNodePos, null, {
      ...node.attrs, width: this.targetWidth, height: this.targetHeight,
    });
    tr = tr.setSelection(NodeSelection.create(tr.doc, this.imgNodePos));
    this.view.dispatch(tr);

    this.rafID && cancelAnimationFrame(this.rafID);
    this.rafID = 0;
  }
}

export class Image extends Node {
  selectedImg = null;
  imgPos = 0;
  boxes = {};

  get name() {
    return IMAGE;
  }

  get schema() {
    return {
      inline: true,
      attrs: {
        align: { default: null },
        alt: { default: '' },
        crop: { default: null },
        height: { default: null },
        rotate: { default: null },
        src: { default: null },
        title: { default: '' },
        width: { default: null },
      },
      group: 'inline',
      draggable: true,
      parseDOM: [{ tag: 'img[src]', getAttrs }],
      toDOM(node) {
        return ['img', node.attrs];
      },
    };
  }

  get plugins() {
    return [
      new Plugin({
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply: (tr, old) => {
            const imageMeta = tr.getMeta(imagePluginKey);
            if (imageMeta && imageMeta.updated) {
              try {
                return this.createDecorations(tr.doc, imageMeta.view);
              } catch (err) {
                return old;
              }
            }
            return old;
          },
        },
        props: {
          handleDOMEvents: {
            drop(view, event) {
              const hasFiles = event.dataTransfer
                && event.dataTransfer.files
                && event.dataTransfer.files.length

              if (!hasFiles) {
                return
              }

              const images = Array
                .from(event.dataTransfer.files)
                .filter(file => (/image/i).test(file.type))

              if (images.length === 0) {
                return
              }

              event.preventDefault()

              const { schema } = view.state
              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })

              images.forEach(image => {
                const reader = new FileReader()

                reader.onload = readerEvent => {
                  const node = schema.nodes.image.create({
                    src: readerEvent.target.result,
                  })
                  const transaction = view.state.tr.insert(coordinates.pos, node)
                  view.dispatch(transaction)
                }
                reader.readAsDataURL(image)
              })
            },
          },
          onBlur: (view) => {
            this.setImgNode(view, null, 0);
          },
          decorations(state) {
            return this.getState(state);
          },
        },
        view: () => {
          const self = this;
          return {
            update: (view, lastState) => {
              let { state } = view;
              if (lastState
                && lastState.doc.eq(state.doc)
                && lastState.selection.eq(state.selection)) {
                return;
              }
              const { selection } = state;
              const { node, from } = selection;
              if (node && node.type.name === IMAGE) {
                self.setImgNode(view, node, from);
              } else {
                self.setImgNode(view, null, 0);
              }
            },
          };
        },
      }),
    ]
  }

  setImgNode(view, node, pos) {
    this.selectedImg = node;
    this.imgPos = pos;
    setMeta(view, imagePluginKey, { view, updated: true });
  }

  createDecorations(doc, view) {
    const decorations = [];
    if (this.selectedImg !== null) {
      const { left, top, bottom } = relativeCoordsAt(view, this.imgPos);
      const { left: right } = relativeCoordsAt(view, this.imgPos + 1);
      const width = Math.abs(right - left);
      const height = bottom - top;
      decorations.push(Decoration.widget(
        this.imgPos + 1,
        () => {
          const resizer = document.createElement('div');
          resizer.classList.add('img-resizer');
          resizer.style.position = 'absolute';
          resizer.style.top = `${top}px`;
          resizer.style.left = `${left}px`;
          resizer.style.width = `${width}px`;
          resizer.style.height = `${height}px`;

          const topLeftBox = this.createResizerBox(view, resizer, 'top_left', width, height);
          topLeftBox.style.top = '0';
          topLeftBox.style.left = '0';
          topLeftBox.style.cursor = 'nw-resize';

          const topBox = this.createResizerBox(view, resizer, 'top', width, height);
          topBox.style.top = '0';
          topBox.style.left = '50%';
          topBox.style.cursor = 'n-resize';

          const topRightBox = this.createResizerBox(view, resizer, 'top_right', width, height);
          topRightBox.style.top = '0';
          topRightBox.style.left = '100%';
          topRightBox.style.cursor = 'ne-resize';

          const rightBox = this.createResizerBox(view, resizer, 'right', width, height);
          rightBox.style.top = '50%';
          rightBox.style.left = '100%';
          rightBox.style.cursor = 'e-resize';

          const bottomRightBox = this.createResizerBox(view, resizer, 'bottom_right', width, height);
          bottomRightBox.style.top = '100%';
          bottomRightBox.style.left = '100%';
          bottomRightBox.style.cursor = 'se-resize';

          const bottomBox = this.createResizerBox(view, resizer, 'bottom', width, height);
          bottomBox.style.top = '100%';
          bottomBox.style.left = '50%';
          bottomBox.style.cursor = 's-resize';

          const bottomLeftBox = this.createResizerBox(view, resizer, 'bottom_left', width, height);
          bottomLeftBox.style.top = '100%';
          bottomLeftBox.style.left = '0';
          bottomLeftBox.style.cursor = 'sw-resize';

          const leftBox = this.createResizerBox(view, resizer, 'left', width, height);
          leftBox.style.top = '50%';
          leftBox.style.left = '0';
          leftBox.style.cursor = 'w-resize';

          const img = document.createElement('img');
          img.classList.add('img-resize-preview');
          img.src = this.selectedImg.attrs.src;
          resizer.append(img);

          return resizer;
        },
      ));
    }
    return DecorationSet.create(doc, decorations);
  }

  createResizerBox(view, parent, direction, width, height) {
    const box = new ResizeBox(parent, direction);
    box.width = width;
    box.height = height;
    box.imgNode = this.selectedImg;
    box.imgNodePos = this.imgPos;
    box.view = view;
    this.boxes[direction] = box;
    parent.append(box.el);
    return box.el;
  }
}
