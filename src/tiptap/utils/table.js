import { TextSelection } from 'prosemirror-state';
import {
  CellSelection,
  TableMap,
  deleteTable,
  goToNextCell,
  isInTable,
  selectedRect,
  rowIsHeader,
  setAttr,
  tableNodeTypes,
} from 'prosemirror-tables';
import { findParentNodeOfType } from 'prosemirror-utils';
import { PARAGRAPH, TABLE, TABLE_CELL, TABLE_HEADER, TABLE_ROW } from '../nodes/names';
import { PathTraverser } from './node';

function findActionableCellFromSelection(selection) {
  const { $anchorCell } = selection;
  const start = $anchorCell.start(-1);
  const table = $anchorCell.node(-1);
  const tableMap = TableMap.get(table);
  let topRightRect;
  let posFound = null;
  let nodeFound = null;
  selection.forEachCell((cell, cellPos) => {
    const cellRect = tableMap.findCell(cellPos - start);
    if (
      !topRightRect ||
      (cellRect.top >= topRightRect.top && cellRect.left > topRightRect.left)
    ) {
      topRightRect = cellRect;
      posFound = cellPos;
      nodeFound = cell;
    }
  });

  return posFound === null
    ? null
    : {
      node: nodeFound,
      pos: posFound,
    };
}

function addRowAndMove(tr, { map, tableStart, table }, row) {
  let rowPos = tableStart
  for (let i = 0; i < row; i++) rowPos += table.child(i).nodeSize
  let cells = [], refRow = row > 0 ? -1 : 0
  if (rowIsHeader(map, table, row + refRow))
    refRow = row == 0 || row == map.height ? null : 0
  for (let col = 0, index = map.width * row; col < map.width; col++, index++) {
    // Covered by a rowspan cell
    if (row > 0 && row < map.height && map.map[index] == map.map[index - map.width]) {
      let pos = map.map[index], attrs = table.nodeAt(pos).attrs
      tr.setNodeMarkup(tableStart + pos, null, setAttr(attrs, "rowspan", attrs.rowspan + 1))
      col += attrs.colspan - 1
    } else {
      let type = refRow == null ? tableNodeTypes(table.type.schema).cell
        : table.nodeAt(map.map[index + refRow * map.width]).type
      cells.push(type.createAndFill())
    }
  }
  tr.insert(rowPos, tableNodeTypes(table.type.schema).row.create(null, cells))
  if (cells.length > 0) {
    tr.setSelection(TextSelection.create(tr.doc, rowPos + 3)).scrollIntoView();
  }
  return tr
}

function addRowAndMoveNext(state, dispatch) {
  if (!isInTable(state)) {
    return false;
  }
  if (dispatch) {
    let rect = selectedRect(state);
    dispatch(addRowAndMove(state.tr, rect, rect.bottom));
  }
  return true
}

export default function findActionableCell(state) {
  const { doc, selection, schema } = state;
  const tdType = schema.nodes[TABLE_CELL];
  const thType = schema.nodes[TABLE_HEADER];
  if (!tdType && !thType) {
    return null;
  }

  let userSelection = selection;

  if (userSelection instanceof TextSelection) {
    const { from, to } = selection;
    if (from !== to) {
      return null;
    }
    const result =
      (tdType && findParentNodeOfType(tdType)(selection)) ||
      (thType && findParentNodeOfType(thType)(selection));

    if (!result) {
      return null;
    }

    userSelection = CellSelection.create(doc, result.pos);
  }

  if (userSelection instanceof CellSelection) {
    return findActionableCellFromSelection(userSelection);
  }

  return null;
}

export function tableBackspace({ schema }) {
  const { nodes } = schema;
  const paragraph = nodes[PARAGRAPH];
  const tableCell = nodes[TABLE_CELL];
  const tableRow = nodes[TABLE_ROW];
  const tableHeader = nodes[TABLE_HEADER];
  const table = nodes[TABLE];
  const isTable = (node) => {
    if (!node) {
      return false;
    }
    return node.type === table;
  }
  const isTableContent = (node) => {
    if (!node) {
      return false;
    }
    return [
      tableCell, tableHeader, tableRow, table
    ].includes(node.type);
  };
  const prevCell = goToNextCell(-1);

  return (state, dispatch) => {
    const { tr } = state;
    const { $from, $to } = tr.selection;
    const traverser = new PathTraverser($from.path);
    if (
      $from === $to
      && traverser.current().node.type === paragraph
      && traverser.current().node.childCount === 0
      && (
        traverser.goUp()
        && isTableContent(traverser.current().node)
        && traverser.current().node.childCount === 1
      )
    ) {
      const { node: selectedNode } = traverser.current();
      while (traverser.valid() && !isTable(traverser.current().node)) {
        traverser.goUp();
      }
      const { node } = traverser.current();
      if (selectedNode === node.firstChild.firstChild) {
        return deleteTable(state, dispatch);
      }
      return prevCell(state, dispatch);
    }
    return false;
  };
}

export function tableTab({ schema }) {
  const { nodes } = schema;
  const tableCell = nodes[TABLE_CELL];
  const tableRow = nodes[TABLE_ROW];
  const tableHeader = nodes[TABLE_HEADER];
  const table = nodes[TABLE];
  const isTable = (node) => {
    if (!node) {
      return false;
    }
    return node.type === table;
  }
  const isTableContent = (node) => {
    if (!node) {
      return false;
    }
    return [
      tableCell, tableHeader, tableRow, table
    ].includes(node.type);
  };
  const nextCell = goToNextCell(1);

  return (state, dispatch) => {
    const { tr } = state;
    const { $from, $to } = tr.selection;
    const traverser = new PathTraverser($from.path);
    if (
      $from === $to
      && (
        traverser.goUp()
        && isTableContent(traverser.current().node)
        && traverser.current().node.childCount === 1
      )
    ) {
      const { node: selectedNode } = traverser.current();
      while (traverser.valid() && !isTable(traverser.current().node)) {
        traverser.goUp();
      }
      const { node: tableNode } = traverser.current();
      if (selectedNode === tableNode.lastChild.lastChild) {
        return addRowAndMoveNext(state, dispatch);
      }
      return nextCell(state, dispatch);
    }
    return false;
  };
}

export function tableShiftTab({ schema }) {
  const { nodes } = schema;
  const tableCell = nodes[TABLE_CELL];
  const tableRow = nodes[TABLE_ROW];
  const tableHeader = nodes[TABLE_HEADER];
  const table = nodes[TABLE];
  const isTableContent = (node) => {
    if (!node) {
      return false;
    }
    return [
      tableCell, tableHeader, tableRow, table
    ].includes(node.type);
  };
  const prevCell = goToNextCell(-1);

  return (state, dispatch) => {
    const { tr } = state;
    const { $from, $to } = tr.selection;
    const traverser = new PathTraverser($from.path);
    if (
      $from === $to
      && (
        traverser.goUp()
        && isTableContent(traverser.current().node)
      )
    ) {
      return prevCell(state, dispatch);
    }
    return false;
  };
}
