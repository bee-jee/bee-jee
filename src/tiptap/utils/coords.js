import { offset } from "../../helpers/dom";

export function relativeCoordsAt(view, pos) {
  let { left, top, bottom, right } = view.coordsAtPos(pos);
  const { left: viewLeft, top: viewTop } = offset(view.dom);
  left -= viewLeft;
  top -= viewTop;
  bottom -= viewTop;
  return { left, top, right, bottom };
}
