'use strict';

var Q = QUnit,
    videojs = window.videojs,
    Decrypter = require('../src/js/decrypter.js'),
    player,
    video,
    decrypter,
    keyRequests,
    keys,
    trigger;

trigger = function(el, event) {
  var k, domEvent = new Event(event.type);
  for (k in event) {
    if (k === 'type') {
      continue;
    }
    domEvent[k] = event[k];
  }
  el.dispatchEvent(domEvent);
};

Q.module('Decrypter', {
  setup: function() {
    video = document.createElement('video');
    video.onneedkey = null;
    video.onwebkitneedkey = null;
    video.canPlayType = function() {
      return true;
    };
    // mock out the EME 0.1b key event flow
    keyRequests = [];
    video.webkitGenerateKeyRequest = function(keySystem, initData) {
      keyRequests.push(Array.prototype.slice.call(arguments));
    };
    keys = [];
    video.webkitAddKey = function(keySystem, key, initData, sessionId) {
      keys.push(Array.prototype.slice.call(arguments));
    };
    player = videojs(video);
    decrypter = new Decrypter(player.tech);
  }
});

Q.test('errors if an unsupported key system is detected', function() {
  var errors = [];
  player.on('error', function(event) {
    errors.push(event);
  });
  video.canPlayType = function() {
    return false;
  };
  video.webkitGenerateKeyRequest = function() {
    errors.push('should not request keys when an error occurs');
  };
  trigger(video, {
    type: 'webkitneedkey',
    keySystem: 'unsupported key system'
  });

  Q.equal(errors.length, 1, 'triggered an error');
  Q.equal(player.error().code,
          window.MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED,
          'type is SRC_NOT_SUPPORTED');
});

Q.test('throws early if used in a browser without EME support', function() {
  try {
    new Decrypter({
      player: Function.prototype,
      el: function() {
        return {};
      }
    });
  } catch (e) {
    return Q.ok(e, 'threw an error on construction');
  }
  Q.ok(false, 'threw an error on construction');
});

Q.test('requests keys', function() {
  var keySystem, initData;
  video.webkitGenerateKeyRequest = function(ksystem, data) {
    keySystem = ksystem;
    initData = data;
  };
  trigger(video, {
    type: 'webkitneedkey',
    keySystem: 'com.widevine.alpha',
    initData: new Uint8Array([1, 2, 3])
  });

  Q.equal(keySystem, 'com.widevine.alpha', 'passed along the key system');
  Q.deepEqual(initData, new Uint8Array([1, 2, 3]), 'passed along init data');
});

Q.test('assumes the widevine key system when it is unspecified', function() {
  var keySystem;
  video.webkitGenerateKeyRequest = function(ksystem) {
    keySystem = ksystem;
  };
  trigger(video, {
    type: 'webkitneedkey',
    keySystem: ''
  });

  Q.equal(keySystem, 'com.widevine.alpha', 'inferred widevine');
});

Q.test('triggers an error if key message events are empty', function(assert) {
  trigger(video, {
    type: 'webkitneedkey'
  });
  trigger(video, {
    type: 'webkitkeymessage'
  });

  Q.ok(player.error(), 'triggered an error');
});


Q.test('accepts license updates through a simplified workflow', function(assert) {
  var sessionsCreated = 0,
      message = 'opaque data to send to the license server';
  player.on('mediakeymessage', function(event) {
    sessionsCreated++;
    event.mediaKeySession.update(event.message);
  });
  trigger(video, {
    type: 'webkitneedkey',
    keySystem: '',
    initData: new Uint8Array([0, 1, 2]),
    sessionId: 'session id'
  });
  trigger(video, {
    type: 'webkitkeymessage',
    message: message
  });

  Q.equal(sessionsCreated, 1, 'created a key session in response to an encrypted event');
  Q.equal(keyRequests.length, 1, 'made one key request');
  Q.deepEqual(keyRequests[0], [
    'com.widevine.alpha',
    new Uint8Array([0, 1, 2])
  ], 'passed along the key system and initData');
  Q.equal(keys.length, 1, 'added one key');
  Q.deepEqual(keys[0], [
    'com.widevine.alpha',
    message,
    'session id',
  ], 'set the key parameters');
});
