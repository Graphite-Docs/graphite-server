## Graphite Websockets Server

For users that choose to share files and collaborate in real-time, a websockets server is deployed and managed by Graphite. No data is ever stored and it is exclusively used to connect peers. Data is encrypted with wss encryption .

If you'd like to use your own webscokets server, this code can be deployed to the provider of your choosing, or it can be run locally.

To run the server locally, simply clone a copy to your computer, then `cd` into the folder in your terminal. Run `node index.js` to run the server.

In order for this to work with your Graphite instance, you will also have to be running a local instance of Graphite with a modified websockets endpoint. To do so, follow the instructions [here](https://github.com/Graphite-Docs/graphite) to clone Graphite. Then, take the following steps: 

* Open the `client/src/docs/views/editors` folder  
* Open the `SocketEditor` file  
* Update the `endpoint` state vairable with your localhost url for the server or the deployed url if you have deployed the server.   
