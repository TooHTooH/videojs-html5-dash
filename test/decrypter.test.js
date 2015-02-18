'use strict';

var Decrypter = require('../src/js/decrypter.js'),
    videojs = window.videojs,
    Q = QUnit,
    player,
    video,
    decrypter;

Q.module('Decrypter', {
  setup: function() {
    video = Object.create(new videojs.EventEmitter());
    video.onneedkey = null;
    video.onwebkitneedkey = null;
    video.canPlayType = function() {
      return true;
    };
    player = Object.create(new videojs.EventEmitter());
    player.currentType = function() {
      return 'video/mp4';
    };
    player.error = function(event) {
      event.type = 'error';
      return player.trigger.call(player, event);
    };
    decrypter = new Decrypter(player, video);
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
  video.trigger('webkitneedkey', {
    keySystem: 'unsupported key system'
  });

  Q.equal(errors.length, 1, 'triggered an error');
  Q.equal(errors[0].code,
          window.MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED,
          'type is SRC_NOT_SUPPORTED');
});

Q.test('throws early if used in a browser without EME support', function() {
  delete video.onneedkey;
  delete video.onwebkitneedkey;
  try {
    new Decrypter(player, video);
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
  video.trigger({
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
  video.trigger({
    type: 'webkitneedkey',
    keySystem: ''
  });

  Q.equal(keySystem, 'com.widevine.alpha', 'inferred widevine');
});
