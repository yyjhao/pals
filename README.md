# Pals facebook social network visualization

Pals is a simple node.js server application that visualize a user's facebook social network.

## Files

`public/*`: all static files, including images, JavaScripts, stylesheets and html files
`src/fuzzyclust.c`: the modified fuzzyclust code
`src/renderGraph.c`: the force-directed graph rendering code
`FBGraphLoader.js`: A small utility to load facebook graph of a user
`Graph.js`: a graph library to handle import of social graphs and communicating with `fuzzyclust` and `renderGraph`
`app.js`: the main app

## Getting started

Make sure you have node.js installed. Then run

```sh
$ npm install -g grunt-cli
$ npm install
```

to install the dependencies.

Refer to `config.json.example` for an example of config, then create you own `config.json` for your server.

You need to build fuzzyclust by running:

```sh
$ mkdir bin
$ make
```

Then you can start developing by running

```sh
$ grunt
```
