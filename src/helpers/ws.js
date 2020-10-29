let connect = null;
let disconnect = null;
let store = null;
let internalVm = null;
let isConnected = false;

export function initialiseWsFromVue(vm) {
  internalVm = vm;
  connect = vm.$connect.bind(vm);
  disconnect = vm.$disconnect.bind(vm);
  store = vm.$store;
}

export function connectToWs() {
  if (isConnected) {
    return;
  }
  const token = store.getters.token;
  connect(`${process.env.VUE_APP_WS_URL}?access_token=${token}`);
  isConnected = true;
}

export function disconnectToWs() {
  disconnect();
  isConnected = false;
}

export function wsSend(data) {
  if (!internalVm || !internalVm.$socket || internalVm.$socket.readyState !== 1) {
    console.error('Trying to send data before the WS connection is established');
    return;
  }
  if (typeof data !== 'string') {
    data = JSON.stringify(data);
  }
  internalVm.$socket.send(data);
}
