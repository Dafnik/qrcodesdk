// Globals that the smoke bundles expect but the Hermes CLI lacks. It only provides `print`.
(function (global) {
  if (typeof global.console === 'undefined') {
    const log = (...values) => global.print(...values);
    global.console = {log, info: log, warn: log, error: log, debug: log};
  }
  // React DOM's server renderer creates a channel for scheduling, which synchronous rendering never
  // uses.
  if (typeof global.MessageChannel === 'undefined') {
    global.MessageChannel = function MessageChannel() {
      this.port1 = {onmessage: null};
      this.port2 = {postMessage() {}};
    };
  }
})(globalThis);
