'use strict';

module.exports = function Decrypter(player, video) {
  var requestKey = function() {

  };

  video.addEventListener('webkitneedkey', requestKey);
  video.addEventListener('needkey', requestKey);
};
