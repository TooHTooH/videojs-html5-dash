'use strict';

module.exports = function Decrypter(player, video) {
  var requestKey;

  requestKey = function(event) {
    var keySystem = event.keySystem || 'com.widevine.alpha';
    if (!video.canPlayType(player.currentType(), keySystem)) {
      return player.error({
        // MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
        // use the constant to avoid conflicts with monkey-patchers
        code: 4,
        message: 'Unsupported key system'
      });
    }

    // Request keys from the CDM. The keys are sent to the license
    // server to validate this player's license request.
    video.webkitGenerateKeyRequest(keySystem, event.initData);
  };

  // setup EME 0.1b event handlers
  // see https://dvcs.w3.org/hg/html-media/raw-file/eme-v0.1b/encrypted-media/encrypted-media.html
  if ('onwebkitneedkey' in video) {
    video.addEventListener('webkitneedkey', requestKey);
  } else if ('onneedkey' in video) {
    video.addEventListener('needkey', requestKey);
  } else {
    throw new Error('No compatible content protection system detected');
  }
};
