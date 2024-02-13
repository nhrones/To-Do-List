// deno-lint-ignore-file no-explicit-any

/** WebSocket proxy object */
export const KvSocket = new Proxy(self.WebSocket, {

   construct: function (target, args) {

      /** WebSocket proxy instance */
      //@ts-ignore ?
      const instance = new target(...args);

      /**  WebSocket "onopen" handler  */
      const openHandler = (event: any) => {
         console.log('Proxy.Open', event);
      };

      /** WebSocket "onmessage" handler */
      const messageHandler = (event: any) => {
         console.log('Proxy.Message', event);
      };

      /** WebSocket "onclose" handler */
      const closeHandler = (event: any) => {
         console.log('Proxy.Close', event);
         // remove event listeners
         instance.removeEventListener('open', openHandler);
         instance.removeEventListener('message', messageHandler);
         instance.removeEventListener('close', closeHandler);
      };

      /** add event listeners */
      instance.addEventListener('open', openHandler);
      instance.addEventListener('message', messageHandler);
      instance.addEventListener('close', closeHandler);

      /** WebSocket send() proxy */
      const sendProxy = new Proxy(instance.send, {
         apply: function (target, thisArg, args) {
            console.log('Proxy.Send', args);
            //@ts-ignore ?
            target.apply(thisArg, args);
         }
      });

      /** replace the native send function with the proxy */
      instance.send = sendProxy;

      // return the WebSocket instance
      return instance;
   }
});
