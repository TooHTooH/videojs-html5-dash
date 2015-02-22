'use strict';

var videojs = require('global/window').videojs,
    MediaKeys,
    MediaKeySession,

    // widevine is the only implemented CDM in EME v0.1b
    // future EME recommends key systems are specified ahead of
    // loading media
    KEY_SYSTEM = 'com.widevine.alpha';

// ---------
// Decrypter
// ---------

module.exports = function Decrypter(tech) {
  var player = tech.player(),
      video =  tech.el(),
      requestKey, createKeySession, session;

  requestKey = function(event) {
    if (!(event.keySystem === '' || event.keySystem === KEY_SYSTEM) ||
        !video.canPlayType('video/mp4', KEY_SYSTEM)) {
      return player.error({
        // MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
        // use the constant to avoid conflicts with monkey-patchers
        code: 4,
        message: 'Unsupported key system: "' + event.keySystem + '"'
      });
    }

    // create a session to track data related to this set of CDM
    // interactions
    session = player.mediaKeys().createSession('temporary', event);

    // Request keys from the CDM. The keys are sent to the license
    // server to validate this player's license request.
    // https://w3c.github.io/encrypted-media/initdata-format-registry.html
    session.generateRequest('cenc', event.initData);
  };

  createKeySession = function(event) {
    if (!event.message) {
      return player.error({
        // MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
        // use the constant to avoid conflicts with monkey-patchers
        code: 4,
        message: 'Key request generated an invalid response'
      });
    }
    player.trigger({
      type: 'mediakeymessage',
      originalEvent: event,
      message: event.message,
      mediaKeySession: session
    });
  };

  // setup EME v0.1b event handlers
  // see https://dvcs.w3.org/hg/html-media/raw-file/eme-v0.1b/encrypted-media/encrypted-media.html
  if ('onwebkitneedkey' in video) {
    video.addEventListener('webkitneedkey', requestKey);
    video.addEventListener('webkitkeymessage', createKeySession);
  } else if ('onneedkey' in video) {
    video.addEventListener('needkey', requestKey);
    video.addEventListener('keymessage', createKeySession);
  } else {
    throw new Error('No compatible content protection system detected');
  }
};

// -------------
// EME Emulation
// -------------

/**
 * The MediaKeys object represents a set of keys that an associated
 * HTMLMediaElement can use for decryption of media data during
 * playback. It also represents a CDM instance.
 * https://w3c.github.io/encrypted-media/#idl-def-MediaKeys
 */
MediaKeys = function MediaKeys(player) {
  this.activeMediaKeySessions_ = [];
  this.player_ = player;
};
MediaKeys.prototype = new videojs.EventEmitter();
MediaKeys.prototype.activeMediaKeySessions = function() {
  return this.activeMediaKeySessions_;
};

/**
 * Returns a new MediaKeySession object.
 * @param type {string}
 * @see https://w3c.github.io/encrypted-media/#widl-MediaKeys-createSession-MediaKeySession-MediaKeySessionType-sessionType
 */
MediaKeys.prototype.createSession = function(type, options) {
  var video = this.player_.el().querySelector('.vjs-tech'),
      keySession = new MediaKeySession(video, options);
  this.activeMediaKeySessions().push(keySession);
  return keySession;
};

/**
 * A Media Key Session, or simply Session, provides a context for
 * message exchange with the CDM as a result of which key(s) are made
 * available to the CDM. Sessions are embodied as MediaKeySession
 * objects. Each Key session is associated with a single instance of
 * Initialization Data provided in the generateRequest() call.
 * @see https://w3c.github.io/encrypted-media/#idl-def-MediaKeySession
 */
MediaKeySession = function MediaKeySession(video, options) {
  this.video_ = video;
  this.sessionId_ = options.sessionId;
};
MediaKeySession.prototype = new videojs.EventEmitter();

/**
 * Generates a request based on the initData.
 * @param initDataType {string} a string that indicates what format
 * the initialization data is provided in.
 * @param initData {BufferSource} a block of initialization data
 * containing information about the stream to be decrypted
 * @see https://w3c.github.io/encrypted-media/#widl-MediaKeySession-generateRequest-Promise-void--DOMString-initDataType-BufferSource-initData
 */
MediaKeySession.prototype.generateRequest = function(initDataType, initData) {
  // expose sessionId, step 9.9
  this.sessionId = this.sessionId_;
  // trigger a message event, step 9.11
  this.video_.webkitGenerateKeyRequest(KEY_SYSTEM, initData);
};

/**
 * Provides messages, including licenses, to the CDM.
 * @param response {BufferSource} A message to be provided to the
 * CDM. The contents are Key System-specific. It must not contain
 * executable code.
 * @return {Promise<void>}
 * @see https://w3c.github.io/encrypted-media/#widl-MediaKeySession-update-Promise-void--BufferSource-response
 */
MediaKeySession.prototype.update = function(buffer) {
  this.video_.webkitAddKey(KEY_SYSTEM, buffer, this.sessionId);
};

// -----------------
// Player Extensions
// -----------------

/**
 * The MediaKeys being used when decrypting encrypted media data for
 * this media element.
 * @see https://w3c.github.io/encrypted-media/#widl-HTMLMediaElement-mediaKeys
 */
videojs.Player.prototype.mediaKeys = function() {
  this.mediaKeys_ = this.mediaKeys_ || new MediaKeys(this);
  return this.mediaKeys_;
};
