'use strict';

var express = require('express');
var configurations = module.exports;
var app = express();
var server = require('http').createServer(app);
var WebSocketServer = require('ws').Server
var websocketStream = require('websocket-stream')
var wss = new WebSocketServer({ noServer: true })
var nconf = require('nconf');
var uuid = require('hat');
var settings = require('./settings')(app, configurations, express);

nconf.argv().env().file({ file: 'local.json' });

/* Websocket setup */

var binarySockets = {}

server.on('upgrade', function(req, socket, head) {
  if (!req.url.match(/^\/binary/)) return
  
  wss.handleUpgrade(req, socket, head, function(conn) {
    var stream = websocketStream(conn);
    
    var id = uuid();
    binarySockets[id] = stream;
    
    stream.once('end', leave);
    stream.once('error', leave);

    function leave() {
      delete binarySockets[id];
    }
    
    meat.sendInitialChats(stream);
    stream.on('data', meat.onSocketMessage);
    stream.on('error', console.error);
  })
})

var io = require('socket.io').listen(server);

io.configure(function () {
  io.set('transports', ['websocket', 'xhr-polling']);
  io.set('polling duration', 10);
  io.set('log level', 1);
});

// routes
var meat = require('./routes')(app, nconf, io, binarySockets);

server.listen(process.env.PORT || nconf.get('port'));
