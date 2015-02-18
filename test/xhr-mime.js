'use strict';

sinon.FakeXMLHttpRequest.prototype.overrideMimeType = function(mime) {
  var self = this,
      parser = new DOMParser(),
      parseXml = function() {
        if (self.readystate !== 4) {
          return;
        }
        self.responseXML = parser.parseFromString(self.responseText,
                                                  'application/xml');
        self.removeEventListener('readystatechange', parseXml);
      };

  if (mime === 'application/xml') {
    this.addEventListener('readystatechange', parseXml);
  }
};
