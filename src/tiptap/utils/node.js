export class PathTraverser {
  constructor(path) {
    this.path = path;
    this.index = (path.length / 3) - 1;
  }

  goUp() {
    const isValid = this.valid();
    if (!isValid) {
      return false;
    }
    this.index--;
    return isValid;
  }

  current() {
    if (this.valid()) {
      return {
        offset: this.path[this.index * 3 + 2],
        node: this.path[this.index * 3],
      };
    }
    return {
      offset: 0,
      node: null,
    };
  }

  valid() {
    return this.index >= 0;
  }
}
