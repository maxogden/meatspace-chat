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
var mbstream = require('multibuffer-stream');
var settings = require('./settings')(app, configurations, express);

nconf.argv().env().file({ file: 'local.json' });

/* Websocket setup */

var binarySockets = {}

server.on('upgrade', function(req, socket, head) {
  if (!req.url.match(/^\/binary/)) return
  
  wss.handleUpgrade(req, socket, head, function(conn) {
    var stream = websocketStream(conn);
    var packStream = mbstream.packStream()
    packStream.pipe(stream)
    
    var id = uuid();
    binarySockets[id] = packStream;
    
    stream.once('end', leave);
    stream.once('error', leave);

    function leave() {
      delete binarySockets[id];
    }
    
    meat.sendInitialChats(packStream);
    stream.on('data', meat.onSocketMessage);
  })
})

var io = require('socket.io').listen(server);

io.configure(function () {
  io.set('transports', ['websocket', 'xhr-polling']);
  io.set('polling duration', 10);
  io.set('log level', 1);
  io.set('destroy upgrade', false);
});

// routes
var meat = require('./routes')(app, nconf, io, binarySockets);

var port = process.env.PORT || nconf.get('port');
server.listen(port);

console.log('open :' + port);
