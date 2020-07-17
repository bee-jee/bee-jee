class BufferedWebSocket {
  constructor() {
    this.data = [];
    this.ws = null;
  }

  send(data) {
    if (this.ws === null || this.ws.readyState !== 1) {
      this.data.push(data);
    } else {
      data.payload = {
        ...options.defaults,
        ...data.payload,
      };
      this.ws.send(JSON.stringify(data));
    }
  }

  onOpen() {
    const self = this;
    this.data.forEach((data) => {
      self.send(data);
    });
    this.data = [];
  }
}

const instance = new BufferedWebSocket();

const options = {
  defaults: {},
};

export function setWs(ws) {
  instance.ws = ws;
  instance.onOpen();
}

export function removeWs() {
  instance.ws = null;
}

export function wsSend(data) {
  instance.send(data);
}

export default {
  defaults: options.defaults,
};
