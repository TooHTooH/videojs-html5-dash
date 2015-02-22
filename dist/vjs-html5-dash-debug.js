(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
if (typeof window !== "undefined") {
    module.exports = window;
} else if (typeof global !== "undefined") {
    module.exports = global;
} else if (typeof self !== "undefined"){
    module.exports = self;
} else {
    module.exports = {};
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],2:[function(require,module,exports){
'use strict';

var existy = require('./util/existy.js'),
    getMediaTypeFromMimeType = require('./util/getMediaTypeFromMimeType.js'),
    getSegmentListForRepresentation = require('./dash/segments/getSegmentListForRepresentation.js'),
    findElementInArray = require('./util/findElementInArray.js'),
    mediaTypes = require('./manifest/MediaTypes.js');

/**
 *
 * Primary data view for representing the set of segment lists and other general information for a give media type
 * (e.g. 'audio' or 'video').
 *
 * @param adaptationSet The MPEG-DASH correlate for a given media set, containing some way of representating segment lists
 *                      and a set of representations for each stream variant.
 * @constructor
 */
function MediaSet(adaptationSet) {
    // TODO: Additional checks & Error Throwing
    this.__adaptationSet = adaptationSet;
}

MediaSet.prototype.getMediaType = function getMediaType() {
    var type = getMediaTypeFromMimeType(this.getMimeType(), mediaTypes);
    return type;
};

MediaSet.prototype.getMimeType = function getMimeType() {
    var mimeType = this.__adaptationSet.getMimeType();
    return mimeType;
};

MediaSet.prototype.getSourceBufferType = function getSourceBufferType() {
    // NOTE: Currently assuming the codecs associated with each stream variant/representation
    // will be similar enough that you won't have to re-create the source-buffer when switching
    // between them.

    var representation = this.__adaptationSet.getRepresentations()[0],
        segmentList = getSegmentListForRepresentation(representation);
    return segmentList.getType();
};

MediaSet.prototype.getTotalDuration = function getTotalDuration() {
    var representation = this.__adaptationSet.getRepresentations()[0],
        segmentList = getSegmentListForRepresentation(representation),
        totalDuration = segmentList.getTotalDuration();
    return totalDuration;
};

MediaSet.prototype.getUTCWallClockStartTime = function() {
    var representation = this.__adaptationSet.getRepresentations()[0],
        segmentList = getSegmentListForRepresentation(representation),
        wallClockTime = segmentList.getUTCWallClockStartTime();
    return wallClockTime;
};

// NOTE: Currently assuming these values will be consistent across all representations. While this is *usually*
// the case, the spec *does* allow segments to not align across representations.
// See, for example: @segmentAlignment AdaptationSet attribute, ISO IEC 23009-1 Sec. 5.3.3.2, pp 24-5.
MediaSet.prototype.getTotalSegmentCount = function getTotalSegmentCount() {
    var representation = this.__adaptationSet.getRepresentations()[0],
        segmentList = getSegmentListForRepresentation(representation),
        totalSegmentCount = segmentList.getTotalSegmentCount();
    return totalSegmentCount;
};

// NOTE: Currently assuming these values will be consistent across all representations. While this is *usually*
// the case in actual practice, the spec *does* allow segments to not align across representations.
// See, for example: @segmentAlignment AdaptationSet attribute, ISO IEC 23009-1 Sec. 5.3.3.2, pp 24-5.
MediaSet.prototype.getSegmentDuration = function getSegmentDuration() {
    var representation = this.__adaptationSet.getRepresentations()[0],
        segmentList = getSegmentListForRepresentation(representation),
        segmentDuration = segmentList.getSegmentDuration();
    return segmentDuration;
};

// NOTE: Currently assuming these values will be consistent across all representations. While this is *usually*
// the case in actual practice, the spec *does* allow segments to not align across representations.
// See, for example: @segmentAlignment AdaptationSet attribute, ISO IEC 23009-1 Sec. 5.3.3.2, pp 24-5.
MediaSet.prototype.getSegmentListStartNumber = function getSegmentListStartNumber() {
    var representation = this.__adaptationSet.getRepresentations()[0],
        segmentList = getSegmentListForRepresentation(representation),
        segmentListStartNumber = segmentList.getStartNumber();
    return segmentListStartNumber;
};

// NOTE: Currently assuming these values will be consistent across all representations. While this is *usually*
// the case in actual practice, the spec *does* allow segments to not align across representations.
// See, for example: @segmentAlignment AdaptationSet attribute, ISO IEC 23009-1 Sec. 5.3.3.2, pp 24-5.
MediaSet.prototype.getSegmentListEndNumber = function getSegmentListEndNumber() {
    var representation = this.__adaptationSet.getRepresentations()[0],
        segmentList = getSegmentListForRepresentation(representation),
        segmentListEndNumber = segmentList.getEndNumber();
    return segmentListEndNumber;
};


MediaSet.prototype.getSegmentLists = function getSegmentLists() {
    var representations = this.__adaptationSet.getRepresentations(),
        segmentLists = representations.map(getSegmentListForRepresentation);
    return segmentLists;
};

MediaSet.prototype.getSegmentListByBandwidth = function getSegmentListByBandwidth(bandwidth) {
    var representations = this.__adaptationSet.getRepresentations(),
        representationWithBandwidthMatch = findElementInArray(representations, function(representation) {
            var representationBandwidth = representation.getBandwidth();
            return (Number(representationBandwidth) === Number(bandwidth));
        }),
        segmentList = getSegmentListForRepresentation(representationWithBandwidthMatch);
    return segmentList;
};

MediaSet.prototype.getAvailableBandwidths = function getAvailableBandwidths() {
    return this.__adaptationSet.getRepresentations().map(
        function(representation) {
            return Number(representation.getBandwidth());
        }).filter(
        function(bandwidth) {
            return existy(bandwidth);
        }
    );
};

module.exports = MediaSet;
},{"./dash/segments/getSegmentListForRepresentation.js":9,"./manifest/MediaTypes.js":17,"./util/existy.js":21,"./util/findElementInArray.js":23,"./util/getMediaTypeFromMimeType.js":24}],3:[function(require,module,exports){
'use strict';

var existy = require('./util/existy.js'),
    isNumber = require('./util/isNumber.js'),
    extendObject = require('./util/extendObject.js'),
    EventDispatcherMixin = require('./events/EventDispatcherMixin.js'),
    loadSegment = require('./segments/loadSegment.js'),
    // TODO: Determine appropriate default size (or base on segment n x size/duration?)
    // Must consider ABR Switching & Viewing experience of already-buffered segments.
    MIN_DESIRED_BUFFER_SIZE = 20,
    MAX_DESIRED_BUFFER_SIZE = 40,
    DEFAULT_RETRY_COUNT = 3,
    DEFAULT_RETRY_INTERVAL = 250;

function waitTimeToRecheckStatic(currentTime,
                                       bufferedTimeRanges,
                                       segmentDuration,
                                       lastDownloadRoundTripTime,
                                       minDesiredBufferSize,
                                       maxDesiredBufferSize) {
    var currentRange = findTimeRangeEdge(currentTime, bufferedTimeRanges),
        bufferSize;

    if (!existy(currentRange)) { return 0; }

    bufferSize = currentRange.getEnd() - currentTime;

    if (bufferSize < minDesiredBufferSize) { return 0; }
    else if (bufferSize < maxDesiredBufferSize) { return (segmentDuration - lastDownloadRoundTripTime) * 1000; }

    return Math.floor(Math.min(segmentDuration, 2) * 1000);
}

function waitTimeToRecheckLive(currentTime, bufferedTimeRanges, segmentList) {
    var currentRange = findTimeRangeEdge(currentTime, bufferedTimeRanges),
        nextSegment,
        safeLiveEdge,
        timePastSafeLiveEdge;

    if (!existy(currentRange)) { return 0; }

    nextSegment = segmentList.getSegmentByTime(currentRange.getEnd());
    safeLiveEdge = (Date.now() - (segmentList.getSegmentDuration() * 1000));
    timePastSafeLiveEdge = nextSegment.getUTCWallClockStartTime() - safeLiveEdge;

    if (timePastSafeLiveEdge < 0.003) { return 0; }

    return timePastSafeLiveEdge;
}

function nextSegmentToLoad(currentTime, bufferedTimeRanges, segmentList) {
    var currentRange = findTimeRangeEdge(currentTime, bufferedTimeRanges),
        segmentToLoad;

    if (existy(currentRange)) {
        segmentToLoad = segmentList.getSegmentByTime(currentRange.getEnd());
    } else if (segmentList.getIsLive()) {
        segmentToLoad = segmentList.getSegmentByUTCWallClockTime(Date.now() - (segmentList.getSegmentDuration() * 1000));
    } else {
        // Otherwise (i.e. if VOD/static streams, get the segment @ currentTime).
        segmentToLoad = segmentList.getSegmentByTime(currentTime);
    }

    return segmentToLoad;
}

function findTimeRangeEdge(currentTime, bufferedTimeRanges) {
    var currentRange = bufferedTimeRanges.getTimeRangeByTime(currentTime),
        i,
        length,
        timeRangeToCheck;

    if (!existy(currentRange)) { return currentRange; }

    i = currentRange.getIndex() + 1;
    length = bufferedTimeRanges.getLength();

    for (;i<length;i++) {
        timeRangeToCheck = bufferedTimeRanges.getTimeRangeByIndex(i);
        if((timeRangeToCheck.getStart() - currentRange.getEnd()) > 0.003) { break; }
        currentRange = timeRangeToCheck;
    }

    return currentRange;
}

/**
 *
 * MediaTypeLoader coordinates between segment downloading and adding segments to the MSE source buffer for a given media type (e.g. 'audio' or 'video').
 *
 * @param sourceBufferDataQueue {SourceBufferDataQueue} object instance that handles adding segments to MSE SourceBuffer
 * @param mediaType {string}                            string representing the media type (e.g. 'audio' or 'video') for the media set
 * @param tech {object}                                 video.js Html5 tech instance.
 * @constructor
 */
function MediaTypeLoader(manifestController, mediaType, sourceBufferDataQueue, tech) {
    if (!existy(manifestController)) { throw new Error('MediaTypeLoader must be initialized with a manifestController!'); }
    if (!existy(mediaType)) { throw new Error('MediaTypeLoader must be initialized with a mediaType!'); }
    // NOTE: Rather than passing in a reference to the MediaSet instance for a media type, we pass in a reference to the
    // controller & the mediaType so that the MediaTypeLoader doesn't need to be aware of state changes/updates to
    // the manifest data (say, if the playlist is dynamic/'live').
    this.__manifestController = manifestController;
    this.__mediaType = mediaType;
    this.__sourceBufferDataQueue = sourceBufferDataQueue;
    this.__tech = tech;
    // Currently, set the default bandwidth to the 0th index of the available bandwidths. Can changed to whatever seems
    // appropriate (CJP).
    this.setCurrentBandwidth(this.getAvailableBandwidths()[0]);
}

/**
 * Enumeration of events instances of this object will dispatch.
 */
MediaTypeLoader.prototype.eventList = {
    RECHECK_SEGMENT_LOADING: 'recheckSegmentLoading',
    RECHECK_CURRENT_SEGMENT_LIST: 'recheckCurrentSegmentList',
    DOWNLOAD_DATA_UPDATE: 'downloadDataUpdate'
};

MediaTypeLoader.prototype.getMediaType = function() { return this.__mediaType; };

MediaTypeLoader.prototype.getMediaSet = function() { return this.__manifestController.getMediaSetByType(this.__mediaType); };

MediaTypeLoader.prototype.getSourceBufferDataQueue = function() { return this.__sourceBufferDataQueue; };

MediaTypeLoader.prototype.getCurrentSegmentList = function getCurrentSegmentList() {
    return this.getMediaSet().getSegmentListByBandwidth(this.getCurrentBandwidth());
};

MediaTypeLoader.prototype.getCurrentBandwidth = function getCurrentBandwidth() { return this.__currentBandwidth; };

/**
 * Sets the current bandwidth, which corresponds to the currently selected segment list (i.e. the segment list in the
 * media set from which we should be downloading segments).
 * @param bandwidth {number}
 */
MediaTypeLoader.prototype.setCurrentBandwidth = function setCurrentBandwidth(bandwidth) {
    if (!isNumber(bandwidth)) {
        throw new Error('MediaTypeLoader::setCurrentBandwidth() expects a numeric value for bandwidth!');
    }
    var availableBandwidths = this.getAvailableBandwidths();
    if (availableBandwidths.indexOf(bandwidth) < 0) {
        throw new Error('MediaTypeLoader::setCurrentBandwidth() must be set to one of the following values: ' + availableBandwidths.join(', '));
    }
    if (bandwidth === this.__currentBandwidth) { return; }
    // Track when we've switch bandwidths, since we'll need to (re)load the initialization segment for the segment list
    // whenever we switch between segment lists. This allows MediaTypeLoader instances to automatically do this, hiding those
    // details from the outside.
    this.__currentBandwidthChanged = true;
    this.__currentBandwidth = bandwidth;
};

MediaTypeLoader.prototype.getAvailableBandwidths = function() { return this.getMediaSet().getAvailableBandwidths(); };

MediaTypeLoader.prototype.getLastDownloadRoundTripTimeSpan = function() { return this.__lastDownloadRoundTripTimeSpan || 0; };

/**
 * Kicks off segment loading for the media set
 */
MediaTypeLoader.prototype.startLoadingSegments = function() {

    var self = this,
        nowUTC;

    // Event listener for rechecking segment loading. This event is fired whenever a segment has been successfully
    // downloaded and added to the buffer or, if not currently loading segments (because the buffer is sufficiently full
    // relative to the current playback time), whenever some amount of time has elapsed and we should check on the buffer
    // state again.
    // NOTE: Store a reference to the event handler to potentially remove it later.
    this.__recheckSegmentLoadingHandler = function(event) {
        self.trigger({ type:self.eventList.RECHECK_CURRENT_SEGMENT_LIST, target:self });
        self.__checkSegmentLoading(self.__tech.currentTime(), MIN_DESIRED_BUFFER_SIZE, MAX_DESIRED_BUFFER_SIZE);
    };

    this.on(this.eventList.RECHECK_SEGMENT_LOADING, this.__recheckSegmentLoadingHandler);
    this.__tech.on('seeking', this.__recheckSegmentLoadingHandler);

    if (this.getCurrentSegmentList().getIsLive()) {
        nowUTC = Date.now();
        this.one(this.eventList.RECHECK_SEGMENT_LOADING, function(event) {
            var seg = self.getCurrentSegmentList().getSegmentByUTCWallClockTime(nowUTC),
                segUTCStartTime = seg.getUTCWallClockStartTime(),
                timeOffset = (nowUTC - segUTCStartTime)/1000,
                seekToTime = self.__sourceBufferDataQueue.getBufferedTimeRangeListAlignedToSegmentDuration(seg.getDuration()).getTimeRangeByIndex(0).getStart() + timeOffset;
            self.__tech.setCurrentTime(seekToTime);
        });
    }

    // Manually check on loading segments the first time around.
    this.__checkSegmentLoading(this.__tech.currentTime(), MIN_DESIRED_BUFFER_SIZE, MAX_DESIRED_BUFFER_SIZE);
};

MediaTypeLoader.prototype.stopLoadingSegments = function() {
    if (!existy(this.__recheckSegmentLoadingHandler)) { return; }

    this.off(this.eventList.RECHECK_SEGMENT_LOADING, this.__recheckSegmentLoadingHandler);
    this.__tech.off('seeking', this.__recheckSegmentLoadingHandler);
    this.__recheckSegmentLoadingHandler = undefined;
    if (existy(this.__waitTimerId)) {
        clearTimeout(this.__waitTimerId);
        this.__waitTimerId = undefined;
    }
};

MediaTypeLoader.prototype.__checkSegmentLoading = function(currentTime, minDesiredBufferSize, maxDesiredBufferSize) {
    var lastDownloadRoundTripTime = this.getLastDownloadRoundTripTimeSpan(),
        loadInitialization = this.__currentBandwidthChanged,
        segmentList = this.getCurrentSegmentList(),
        segmentDuration = segmentList.getSegmentDuration(),
        bufferedTimeRanges = this.__sourceBufferDataQueue.getBufferedTimeRangeListAlignedToSegmentDuration(segmentDuration),
        isLive = segmentList.getIsLive(),
        waitTime,
        segmentToDownload,
        self = this;

    // If we're here but there's a waitTimerId, we should clear it out so we don't do
    // an additional recheck unnecessarily.
    if (existy(this.__waitTimerId)) {
        clearTimeout(this.__waitTimerId);
        this.__waitTimerId = undefined;
    }

    function waitFunction() {
        self.__checkSegmentLoading(self.__tech.currentTime(), minDesiredBufferSize, maxDesiredBufferSize);
        self.__waitTimerId = undefined;
    }

    if (isLive) {
        waitTime = waitTimeToRecheckLive(currentTime, bufferedTimeRanges, segmentList);
    } else {
        waitTime = waitTimeToRecheckStatic(currentTime, bufferedTimeRanges, segmentDuration, lastDownloadRoundTripTime, minDesiredBufferSize, maxDesiredBufferSize);
    }

    if (waitTime > 50) {
        // If wait time was > 50ms, re-check in waitTime ms.
        this.__waitTimerId = setTimeout(waitFunction, waitTime);
    } else {
        // Otherwise, start loading now.
        segmentToDownload = nextSegmentToLoad(currentTime, bufferedTimeRanges, segmentList);
        if (existy(segmentToDownload)) {
            // If we're here but there's a segmentLoadXhr request, we've kicked off a recheck in the middle of a segment
            // download. However, unless we're loading a new segment (ie not waiting), there's no reason to abort the current
            // request, so only cancel here (CJP).
            if (existy(this.__segmentLoadXhr)) {
                this.__segmentLoadXhr.abort();
                this.__segmentLoadXhr = undefined;
            }

            this.__loadAndBufferSegment(segmentToDownload, segmentList, loadInitialization);
        } else {
            // Apparently no segment to load, so go into a holding pattern.
            this.__waitTimerId = setTimeout(waitFunction, 2000);
        }
    }
};

MediaTypeLoader.prototype.__loadAndBufferSegment = function loadAndBufferSegment(segment, segmentList, loadInitialization) {

    var self = this,
        retryCount = DEFAULT_RETRY_COUNT,
        retryInterval = DEFAULT_RETRY_INTERVAL,
        segmentsToBuffer = [],
        requestStartTimeSeconds;

    function successInitialization(data) {
        segmentsToBuffer.push(data.response);
        requestStartTimeSeconds = new Date().getTime()/1000;
        self.__currentBandwidthChanged = false;
        self.__segmentLoadXhr = loadSegment(segment, success, fail, self);
    }

    function success(data) {
        var sourceBufferDataQueue = self.__sourceBufferDataQueue;

        self.__lastDownloadRoundTripTimeSpan = ((new Date().getTime())/1000) - requestStartTimeSeconds;
        segmentsToBuffer.push(data.response);
        self.__segmentLoadXhr = undefined;

        self.trigger(
            {
                type:self.eventList.DOWNLOAD_DATA_UPDATE,
                target: self,
                data: {
                    rtt: self.__lastDownloadRoundTripTimeSpan,
                    playbackTime: segment.getDuration(),
                    bandwidth: segmentList.getBandwidth()
                }
            }
        );

        sourceBufferDataQueue.one(sourceBufferDataQueue.eventList.QUEUE_EMPTY, function(event) {
            // Once we've completed downloading and buffering the segment, dispatch event to notify that we should recheck
            // whether or not we should load another segment and, if so, which. (See: __checkSegmentLoading() method, above)
            self.trigger({ type:self.eventList.RECHECK_SEGMENT_LOADING, target:self });
        });

        sourceBufferDataQueue.addToQueue(segmentsToBuffer);
    }

    function fail(data) {
        if (--retryCount <= 0) {
            // NOTE: Add this if we want to keep retrying (CJP).
            //self.trigger({ type:self.eventList.RECHECK_SEGMENT_LOADING, target:self });
            // NOTE: Add this if we want to give up (CJP).
            //self.stopLoadingSegments();
            return;
        }
        console.log('Failed to load segment @ ' + segment.getUrl() + '. Request Status: ' + data.status);
        setTimeout(function() {
            requestStartTimeSeconds = (new Date().getTime())/1000;
            self.__segmentLoadXhr = loadSegment(data.requestedSegment, success, fail, self);
        }, retryInterval);
    }

    if (loadInitialization) {
        self.__segmentLoadXhr = loadSegment(segmentList.getInitialization(), successInitialization, fail, self);
    } else {
        requestStartTimeSeconds = new Date().getTime()/1000;
        self.__segmentLoadXhr = loadSegment(segment, success, fail, self);
    }
};

// Add event dispatcher functionality to prototype.
extendObject(MediaTypeLoader.prototype, EventDispatcherMixin);

module.exports = MediaTypeLoader;

},{"./events/EventDispatcherMixin.js":12,"./segments/loadSegment.js":19,"./util/existy.js":21,"./util/extendObject.js":22,"./util/isNumber.js":27}],4:[function(require,module,exports){
'use strict';

var existy = require('./util/existy.js'),
    SourceBufferDataQueue = require('./SourceBufferDataQueue.js'),
    MediaTypeLoader = require('./MediaTypeLoader.js'),
    selectSegmentList = require('./selectSegmentList.js'),
    mediaTypes = require('./manifest/MediaTypes.js');

// TODO: Migrate methods below to a factory.
function createSourceBufferDataQueueByType(manifestController, mediaSource, mediaType) {
    var sourceBufferType = manifestController.getMediaSetByType(mediaType).getSourceBufferType(),
        // TODO: Try/catch block?
        sourceBuffer = mediaSource.addSourceBuffer(sourceBufferType);
    return new SourceBufferDataQueue(sourceBuffer);
}

function createMediaTypeLoaderForType(manifestController, mediaSource, mediaType, tech) {
    var sourceBufferDataQueue = createSourceBufferDataQueueByType(manifestController, mediaSource, mediaType);
    return new MediaTypeLoader(manifestController, mediaType, sourceBufferDataQueue, tech);
}

/**
 *
 * Factory-style function for creating a set of MediaTypeLoaders based on what's defined in the manifest and what media types are supported.
 *
 * @param manifestController {ManifestController}   controller that provides data views for the ABR playlist manifest data
 * @param mediaSource {MediaSource}                 MSE MediaSource instance corresponding to the current ABR playlist
 * @param tech {object}                             video.js Html5 tech object instance
 * @returns {Array.<MediaTypeLoader>}               Set of MediaTypeLoaders for loading segments for a given media type (e.g. audio or video)
 */
function createMediaTypeLoaders(manifestController, mediaSource, tech) {
    var matchedTypes = mediaTypes.filter(function(mediaType) {
            var exists = existy(manifestController.getMediaSetByType(mediaType));
            return exists; }),
        mediaTypeLoaders = matchedTypes.map(function(mediaType) { return createMediaTypeLoaderForType(manifestController, mediaSource, mediaType, tech); });
    return mediaTypeLoaders;
}

/**
 *
 * PlaylistLoader handles the top-level loading and playback of segments for all media types (e.g. both audio and video).
 * This includes checking if it should switch segment lists, updating/retrieving data relevant to these decision for
 * each media type. It also includes changing the playback rate of the video based on data available in the source buffer.
 *
 * @param manifestController {ManifestController}   controller that provides data views for the ABR playlist manifest data
 * @param mediaSource {MediaSource}                 MSE MediaSource instance corresponding to the current ABR playlist
 * @param tech {object}                             video.js Html5 tech object instance
 * @constructor
 */
function PlaylistLoader(manifestController, mediaSource, tech) {
    this.__tech = tech;
    this.__mediaTypeLoaders = createMediaTypeLoaders(manifestController, mediaSource, tech);

    var i;

    function kickoffMediaTypeLoader(mediaTypeLoader) {
        // MediaSet-specific variables
        var downloadRateRatio = 1.0,
            currentSegmentListBandwidth = mediaTypeLoader.getCurrentBandwidth(),
            mediaType = mediaTypeLoader.getMediaType();

        // Listen for event telling us to recheck which segment list the segments should be loaded from.
        mediaTypeLoader.on(mediaTypeLoader.eventList.RECHECK_CURRENT_SEGMENT_LIST, function(event) {
            var mediaSet = manifestController.getMediaSetByType(mediaType),
                isFullscreen = tech.player().isFullscreen(),
                data = {},
                selectedSegmentList;

            data.downloadRateRatio = downloadRateRatio;
            data.currentSegmentListBandwidth = currentSegmentListBandwidth;

            // Rather than monitoring events/updating state, simply get relevant video viewport dims on the fly as needed.
            data.width = isFullscreen ? window.screen.width : tech.player().width();
            data.height = isFullscreen ? window.screen.height : tech.player().height();

            selectedSegmentList = selectSegmentList(mediaSet, data);

            // TODO: Should we refactor to set based on segmentList instead?
            // (Potentially) update which segment list the segments should be loaded from (based on segment list's bandwidth/bitrate)
            mediaTypeLoader.setCurrentBandwidth(selectedSegmentList.getBandwidth());
        });

        // Update the download rate (round trip time to download a segment of a given average bandwidth/bitrate) to use
        // with choosing which stream variant to load segments from.
        mediaTypeLoader.on(mediaTypeLoader.eventList.DOWNLOAD_DATA_UPDATE, function(event) {
            downloadRateRatio = event.data.playbackTime / event.data.rtt;
            currentSegmentListBandwidth = event.data.bandwidth;
        });

        // Kickoff segment loading for the media type.
        mediaTypeLoader.startLoadingSegments();
    }

    // For each of the media types (e.g. 'audio' & 'video') in the ABR manifest...
    for (i=0; i<this.__mediaTypeLoaders.length; i++) {
        kickoffMediaTypeLoader(this.__mediaTypeLoaders[i]);
    }

    // NOTE: This code block handles pseudo-'pausing'/'unpausing' (changing the playbackRate) based on whether or not
    // there is data available in the buffer, but indirectly, by listening to a few events and using the video element's
    // ready state.
    var changePlaybackRateEvents = ['seeking', 'canplay', 'canplaythrough'],
        eventType;

    function changePlaybackRateEventsHandler(event) {
        var readyState = tech.el().readyState,
            playbackRate = (readyState === 4) ? 1 : 0;
        tech.setPlaybackRate(playbackRate);
    }

    for(i=0; i<changePlaybackRateEvents.length; i++) {
        eventType = changePlaybackRateEvents[i];
        tech.on(eventType, changePlaybackRateEventsHandler);
    }
}

module.exports = PlaylistLoader;
},{"./MediaTypeLoader.js":3,"./SourceBufferDataQueue.js":5,"./manifest/MediaTypes.js":17,"./selectSegmentList.js":20,"./util/existy.js":21}],5:[function(require,module,exports){
'use strict';

var isFunction = require('./util/isFunction.js'),
    isArray = require('./util/isArray.js'),
    isNumber = require('./util/isNumber.js'),
    existy = require('./util/existy.js'),
    extendObject = require('./util/extendObject.js'),
    EventDispatcherMixin = require('./events/EventDispatcherMixin.js');

function createTimeRangeObject(sourceBuffer, index, transformFn) {
    if (!isFunction(transformFn)) {
        transformFn = function(time) { return time; };
    }

    return {
        getStart: function() { return transformFn(sourceBuffer.buffered.start(index)); },
        getEnd: function() { return transformFn(sourceBuffer.buffered.end(index)); },
        getIndex: function() { return index; }
    };
}

function createBufferedTimeRangeList(sourceBuffer, transformFn) {
    return {
        getLength: function() { return sourceBuffer.buffered.length; },
        getTimeRangeByIndex: function(index) { return createTimeRangeObject(sourceBuffer, index, transformFn); },
        getTimeRangeByTime: function(time, tolerance) {
            if (!isNumber(tolerance)) { tolerance = 0.15; }
            var timeRangeObj,
                i,
                length = sourceBuffer.buffered.length;

            for (i=0; i<length; i++) {
                timeRangeObj = createTimeRangeObject(sourceBuffer, i, transformFn);
                if ((timeRangeObj.getStart() - tolerance) > time) { return null; }
                if ((timeRangeObj.getEnd() + tolerance) > time) { return timeRangeObj; }
            }

            return null;
        }
    };
}

function createAlignedBufferedTimeRangeList(sourceBuffer, segmentDuration) {
    function timeAlignTransformFn(time) {
        return Math.round(time / segmentDuration) * segmentDuration;
    }

    return createBufferedTimeRangeList(sourceBuffer, timeAlignTransformFn);
}

/**
 * SourceBufferDataQueue adds/queues segments to the corresponding MSE SourceBuffer (NOTE: There should be one per media type/media set)
 *
 * @param sourceBuffer {SourceBuffer}   MSE SourceBuffer instance
 * @constructor
 */
function SourceBufferDataQueue(sourceBuffer) {
    // TODO: Check type?
    if (!sourceBuffer) { throw new Error( 'The sourceBuffer constructor argument cannot be null.' ); }

    var self = this,
        dataQueue = [];
    // TODO: figure out how we want to respond to other event states (updateend? error? abort?) (retry? remove?)
    sourceBuffer.addEventListener('updateend', function(event) {
        // The SourceBuffer instance's updating property should always be false if this event was dispatched,
        // but just in case...
        if (event.target.updating) { return; }

        self.trigger({ type:self.eventList.SEGMENT_ADDED_TO_BUFFER, target:self });

        if (self.__dataQueue.length <= 0) {
            self.trigger({ type:self.eventList.QUEUE_EMPTY, target:self });
            return;
        }

        self.__sourceBuffer.appendBuffer(self.__dataQueue.shift());
    });

    this.__dataQueue = dataQueue;
    this.__sourceBuffer = sourceBuffer;
}

/**
 * Enumeration of events instances of this object will dispatch.
 */
SourceBufferDataQueue.prototype.eventList = {
    QUEUE_EMPTY: 'queueEmpty',
    SEGMENT_ADDED_TO_BUFFER: 'segmentAddedToBuffer'
};

SourceBufferDataQueue.prototype.addToQueue = function(data) {
    var dataToAddImmediately;
    if (!existy(data) || (isArray(data) && data.length <= 0)) { return; }
    // Treat all data as arrays to make subsequent functionality generic.
    if (!isArray(data)) { data = [data]; }
    // If nothing is in the queue, go ahead and immediately append the first data to the source buffer.
    if ((this.__dataQueue.length === 0) && (!this.__sourceBuffer.updating)) { dataToAddImmediately = data.shift(); }
    // If any other data (still) exists, push the rest onto the dataQueue.
    this.__dataQueue = this.__dataQueue.concat(data);
    if (existy(dataToAddImmediately)) { this.__sourceBuffer.appendBuffer(dataToAddImmediately); }
};

SourceBufferDataQueue.prototype.clearQueue = function() {
    this.__dataQueue = [];
};

SourceBufferDataQueue.prototype.getBufferedTimeRangeList = function() {
    return createBufferedTimeRangeList(this.__sourceBuffer);
};

SourceBufferDataQueue.prototype.getBufferedTimeRangeListAlignedToSegmentDuration = function(segmentDuration) {
    return createAlignedBufferedTimeRangeList(this.__sourceBuffer, segmentDuration);
};

// Add event dispatcher functionality to prototype.
extendObject(SourceBufferDataQueue.prototype, EventDispatcherMixin);

module.exports = SourceBufferDataQueue;
},{"./events/EventDispatcherMixin.js":12,"./util/existy.js":21,"./util/extendObject.js":22,"./util/isArray.js":25,"./util/isFunction.js":26,"./util/isNumber.js":27}],6:[function(require,module,exports){
'use strict';

var MediaSource = require('global/window').MediaSource,
    Decrypter = require('./decrypter'),
    ManifestController = require('./manifest/ManifestController.js'),
    PlaylistLoader = require('./PlaylistLoader.js');

// TODO: DISPOSE METHOD
/**
 *
 * Class that defines the root context for handling a specific MPEG-DASH media source.
 *
 * @param source    video.js source object providing information about the source, such as the uri (src) and the type (type)
 * @param tech      video.js Html5 tech object providing the point of interaction between the SourceHandler instance and
 *                  the video.js library (including e.g. the video element)
 * @constructor
 */
function SourceHandler(source, tech) {
    var self = this,
        manifestController = new ManifestController(source.src, false),
        decrypter = new Decrypter(tech);

    manifestController.one(manifestController.eventList.MANIFEST_LOADED, function(event) {
        var mediaSource = new MediaSource(),
            openListener = function(event) {
                mediaSource.removeEventListener('sourceopen', openListener, false);
                self.__playlistLoader = new PlaylistLoader(manifestController, mediaSource, tech);
            };

        mediaSource.addEventListener('sourceopen', openListener, false);

        // TODO: Handle close.
        //mediaSource.addEventListener('webkitsourceclose', closed, false);
        //mediaSource.addEventListener('sourceclose', closed, false);

        tech.setSrc(URL.createObjectURL(mediaSource));
    });

    manifestController.load();
}

module.exports = SourceHandler;

},{"./PlaylistLoader.js":4,"./decrypter":11,"./manifest/ManifestController.js":16,"global/window":1}],7:[function(require,module,exports){
'use strict';

var parseRootUrl,
    // TODO: Should presentationDuration parsing be in util or somewhere else?
    parseMediaPresentationDuration,
    parseDateTime,
    SECONDS_IN_YEAR = 365 * 24 * 60 * 60,
    SECONDS_IN_MONTH = 30 * 24 * 60 * 60, // not precise!
    SECONDS_IN_DAY = 24 * 60 * 60,
    SECONDS_IN_HOUR = 60 * 60,
    SECONDS_IN_MIN = 60,
    MINUTES_IN_HOUR = 60,
    MILLISECONDS_IN_SECONDS = 1000,
    durationRegex = /^P(([\d.]*)Y)?(([\d.]*)M)?(([\d.]*)D)?T?(([\d.]*)H)?(([\d.]*)M)?(([\d.]*)S)?/,
    dateTimeRegex = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2})(?::([0-9]*)(\.[0-9]*)?)?(?:([+-])([0-9]{2})([0-9]{2}))?/;

parseRootUrl = function(url) {
    if (typeof url !== 'string') {
        return '';
    }

    if (url.indexOf('/') === -1) {
        return '';
    }

    if (url.indexOf('?') !== -1) {
        url = url.substring(0, url.indexOf('?'));
    }

    return url.substring(0, url.lastIndexOf('/') + 1);
};

// TODO: Should presentationDuration parsing be in util or somewhere else?
parseMediaPresentationDuration = function (str) {
    //str = "P10Y10M10DT10H10M10.1S";
    if (!str) { return Number.NaN; }
    var match = durationRegex.exec(str);
    if (!match) { return Number.NaN; }
    return (parseFloat(match[2] || 0) * SECONDS_IN_YEAR +
        parseFloat(match[4] || 0) * SECONDS_IN_MONTH +
        parseFloat(match[6] || 0) * SECONDS_IN_DAY +
        parseFloat(match[8] || 0) * SECONDS_IN_HOUR +
        parseFloat(match[10] || 0) * SECONDS_IN_MIN +
        parseFloat(match[12] || 0));
};

/**
 * Parser for formatted datetime strings conforming to the ISO 8601 standard.
 * General Format:  YYYY-MM-DDTHH:MM:SSZ (UTC) or YYYY-MM-DDTHH:MM:SS+HH:MM (time zone localization)
 * Ex String:       2014-12-17T14:09:58Z (UTC) or 2014-12-17T14:15:58+06:00 (time zone localization) / 2014-12-17T14:03:58-06:00 (time zone localization)
 *
 * @param str {string}  ISO 8601-compliant datetime string.
 * @returns {number} UTC Unix time.
 */
parseDateTime = function(str) {
    var match = dateTimeRegex.exec(str),
        utcDate;

    // If the string does not contain a timezone offset different browsers can interpret it either
    // as UTC or as a local time so we have to parse the string manually to normalize the given date value for
    // all browsers
    utcDate = Date.UTC(
        parseInt(match[1], 10),
        parseInt(match[2], 10)-1, // months start from zero
        parseInt(match[3], 10),
        parseInt(match[4], 10),
        parseInt(match[5], 10),
        (match[6] && parseInt(match[6], 10) || 0),
        (match[7] && parseFloat(match[7]) * MILLISECONDS_IN_SECONDS) || 0);
    // If the date has timezone offset take it into account as well
    if (match[9] && match[10]) {
        var timezoneOffset = parseInt(match[9], 10) * MINUTES_IN_HOUR + parseInt(match[10], 10);
        utcDate += (match[8] === '+' ? -1 : +1) * timezoneOffset * SECONDS_IN_MIN * MILLISECONDS_IN_SECONDS;
    }

    return utcDate;
};

var dashUtil = {
    parseRootUrl: parseRootUrl,
    parseMediaPresentationDuration: parseMediaPresentationDuration,
    parseDateTime: parseDateTime
};

module.exports = function getDashUtil() { return dashUtil; };
},{}],8:[function(require,module,exports){
'use strict';

var getXmlFun = require('../../getXmlFun.js'),
    xmlFun = getXmlFun(),
    getDashUtil = require('./getDashUtil.js'),
    dashUtil = getDashUtil(),
    isArray = require('../../util/isArray.js'),
    isFunction = require('../../util/isFunction.js'),
    isString = require('../../util/isString.js'),
    parseRootUrl = dashUtil.parseRootUrl,
    createMpdObject,
    createPeriodObject,
    createAdaptationSetObject,
    createRepresentationObject,
    createSegmentTemplate,
    getMpd,
    getAdaptationSetByType,
    getDescendantObjectsArrayByName,
    getAncestorObjectByName;

// TODO: Should this exist on mpd dataview or at a higher level?
// TODO: Refactor. Could be more efficient (Recursive fn? Use element.getElementsByName('BaseUrl')[0]?).
// TODO: Currently assuming *EITHER* <BaseURL> nodes will provide an absolute base url (ie resolve to 'http://' etc)
// TODO: *OR* we should use the base url of the host of the MPD manifest.
var buildBaseUrl = function(xmlNode) {
    var elemHierarchy = [xmlNode].concat(xmlFun.getAncestors(xmlNode)),
        foundLocalBaseUrl = false;
    var baseUrls = elemHierarchy.map(function(elem) {
        if (foundLocalBaseUrl) { return ''; }
        if (!elem.hasChildNodes()) { return ''; }
        var child;
        for (var i=0; i<elem.childNodes.length; i++) {
            child = elem.childNodes.item(i);
            if (child.nodeName === 'BaseURL') {
                var textElem = child.childNodes.item(0);
                var textValue = textElem.wholeText.trim();
                if (textValue.indexOf('http://') === 0) { foundLocalBaseUrl = true; }
                return textElem.wholeText.trim();
            }
        }

        return '';
    });

    var baseUrl = baseUrls.reverse().join('');
    if (!baseUrl) { return parseRootUrl(xmlNode.baseURI); }
    return baseUrl;
};

var elemsWithCommonProperties = [
    'AdaptationSet',
    'Representation',
    'SubRepresentation'
];

var hasCommonProperties = function(elem) {
    return elemsWithCommonProperties.indexOf(elem.nodeName) >= 0;
};

var doesntHaveCommonProperties = function(elem) {
    return !hasCommonProperties(elem);
};

// Common Attrs
var getWidth = xmlFun.getInheritableAttribute('width'),
    getHeight = xmlFun.getInheritableAttribute('height'),
    getFrameRate = xmlFun.getInheritableAttribute('frameRate'),
    getMimeType = xmlFun.getInheritableAttribute('mimeType'),
    getCodecs = xmlFun.getInheritableAttribute('codecs');

var getSegmentTemplateXmlList = xmlFun.getMultiLevelElementList('SegmentTemplate');

// MPD Attr fns
var getMediaPresentationDuration = xmlFun.getAttrFn('mediaPresentationDuration'),
    getType = xmlFun.getAttrFn('type'),
    getMinimumUpdatePeriod = xmlFun.getAttrFn('minimumUpdatePeriod'),
    getAvailabilityStartTime = xmlFun.getAttrFn('availabilityStartTime'),
    getSuggestedPresentationDelay = xmlFun.getAttrFn('suggestedPresentationDelay'),
    getTimeShiftBufferDepth = xmlFun.getAttrFn('timeShiftBufferDepth');

// Representation Attr fns
var getId = xmlFun.getAttrFn('id'),
    getBandwidth = xmlFun.getAttrFn('bandwidth');

// SegmentTemplate Attr fns
var getInitialization = xmlFun.getAttrFn('initialization'),
    getMedia = xmlFun.getAttrFn('media'),
    getDuration = xmlFun.getAttrFn('duration'),
    getTimescale = xmlFun.getAttrFn('timescale'),
    getPresentationTimeOffset = xmlFun.getAttrFn('presentationTimeOffset'),
    getStartNumber = xmlFun.getAttrFn('startNumber');

// TODO: Repeat code. Abstract away (Prototypal Inheritance/OO Model? Object composer fn?)
createMpdObject = function(xmlNode) {
    return {
        xml: xmlNode,
        // Descendants, Ancestors, & Siblings
        getPeriods: xmlFun.preApplyArgsFn(getDescendantObjectsArrayByName, xmlNode, 'Period', createPeriodObject),
        getMediaPresentationDuration: xmlFun.preApplyArgsFn(getMediaPresentationDuration, xmlNode),
        getType: xmlFun.preApplyArgsFn(getType, xmlNode),
        getMinimumUpdatePeriod: xmlFun.preApplyArgsFn(getMinimumUpdatePeriod, xmlNode),
        getAvailabilityStartTime: xmlFun.preApplyArgsFn(getAvailabilityStartTime, xmlNode),
        getSuggestedPresentationDelay: xmlFun.preApplyArgsFn(getSuggestedPresentationDelay, xmlNode),
        getTimeShiftBufferDepth: xmlFun.preApplyArgsFn(getTimeShiftBufferDepth, xmlNode)
    };
};

createPeriodObject = function(xmlNode) {
    return {
        xml: xmlNode,
        // Descendants, Ancestors, & Siblings
        getAdaptationSets: xmlFun.preApplyArgsFn(getDescendantObjectsArrayByName, xmlNode, 'AdaptationSet', createAdaptationSetObject),
        getAdaptationSetByType: function(type) {
            return getAdaptationSetByType(type, xmlNode);
        },
        getMpd: xmlFun.preApplyArgsFn(getAncestorObjectByName, xmlNode, 'MPD', createMpdObject)
    };
};

createAdaptationSetObject = function(xmlNode) {
    return {
        xml: xmlNode,
        // Descendants, Ancestors, & Siblings
        getRepresentations: xmlFun.preApplyArgsFn(getDescendantObjectsArrayByName, xmlNode, 'Representation', createRepresentationObject),
        getSegmentTemplate: function() {
            return createSegmentTemplate(getSegmentTemplateXmlList(xmlNode));
        },
        getPeriod: xmlFun.preApplyArgsFn(getAncestorObjectByName, xmlNode, 'Period', createPeriodObject),
        getMpd: xmlFun.preApplyArgsFn(getAncestorObjectByName, xmlNode, 'MPD', createMpdObject),
        // Attrs
        getMimeType: xmlFun.preApplyArgsFn(getMimeType, xmlNode)
    };
};

createRepresentationObject = function(xmlNode) {
    return {
        xml: xmlNode,
        // Descendants, Ancestors, & Siblings
        getSegmentTemplate: function() {
            return createSegmentTemplate(getSegmentTemplateXmlList(xmlNode));
        },
        getAdaptationSet: xmlFun.preApplyArgsFn(getAncestorObjectByName, xmlNode, 'AdaptationSet', createAdaptationSetObject),
        getPeriod: xmlFun.preApplyArgsFn(getAncestorObjectByName, xmlNode, 'Period', createPeriodObject),
        getMpd: xmlFun.preApplyArgsFn(getAncestorObjectByName, xmlNode, 'MPD', createMpdObject),
        // Attrs
        getId: xmlFun.preApplyArgsFn(getId, xmlNode),
        getWidth: xmlFun.preApplyArgsFn(getWidth, xmlNode),
        getHeight: xmlFun.preApplyArgsFn(getHeight, xmlNode),
        getFrameRate: xmlFun.preApplyArgsFn(getFrameRate, xmlNode),
        getBandwidth: xmlFun.preApplyArgsFn(getBandwidth, xmlNode),
        getCodecs: xmlFun.preApplyArgsFn(getCodecs, xmlNode),
        getBaseUrl: xmlFun.preApplyArgsFn(buildBaseUrl, xmlNode),
        getMimeType: xmlFun.preApplyArgsFn(getMimeType, xmlNode)
    };
};

createSegmentTemplate = function(xmlArray) {
    // Effectively a find function + a map function.
    function getAttrFromXmlArray(attrGetterFn, xmlArray) {
        if (!isArray(xmlArray)) { return undefined; }
        if (!isFunction(attrGetterFn)) { return undefined; }

        var i,
            length = xmlArray.length,
            currentAttrValue;

        for (i=0; i<xmlArray.length; i++) {
            currentAttrValue = attrGetterFn(xmlArray[i]);
            if (isString(currentAttrValue) && currentAttrValue !== '') { return currentAttrValue; }
        }

        return undefined;
    }

    return {
        xml: xmlArray,
        // Descendants, Ancestors, & Siblings
        getAdaptationSet: xmlFun.preApplyArgsFn(getAncestorObjectByName, xmlArray[0], 'AdaptationSet', createAdaptationSetObject),
        getPeriod: xmlFun.preApplyArgsFn(getAncestorObjectByName, xmlArray[0], 'Period', createPeriodObject),
        getMpd: xmlFun.preApplyArgsFn(getAncestorObjectByName, xmlArray[0], 'MPD', createMpdObject),
        // Attrs
        getInitialization: xmlFun.preApplyArgsFn(getAttrFromXmlArray, getInitialization, xmlArray),
        getMedia: xmlFun.preApplyArgsFn(getAttrFromXmlArray, getMedia, xmlArray),
        getDuration: xmlFun.preApplyArgsFn(getAttrFromXmlArray, getDuration, xmlArray),
        getTimescale: xmlFun.preApplyArgsFn(getAttrFromXmlArray, getTimescale, xmlArray),
        getPresentationTimeOffset: xmlFun.preApplyArgsFn(getAttrFromXmlArray, getPresentationTimeOffset, xmlArray),
        getStartNumber: xmlFun.preApplyArgsFn(getAttrFromXmlArray, getStartNumber, xmlArray)
    };
};

// TODO: Change this api to return a list of all matching adaptation sets to allow for greater flexibility.
getAdaptationSetByType = function(type, periodXml) {
    var adaptationSets = periodXml.getElementsByTagName('AdaptationSet'),
        adaptationSet,
        representation,
        mimeType;

    for (var i=0; i<adaptationSets.length; i++) {
        adaptationSet = adaptationSets.item(i);
        // Since the mimeType can be defined on the AdaptationSet or on its Representation child nodes,
        // check for mimetype on one of its Representation children using getMimeType(), which assumes the
        // mimeType can be inherited and will check itself and its ancestors for the attr.
        representation = adaptationSet.getElementsByTagName('Representation')[0];
        // Need to check the representation instead of the adaptation set, since the mimeType may not be specified
        // on the adaptation set at all and may be specified for each of the representations instead.
        mimeType = getMimeType(representation);
        if (!!mimeType && mimeType.indexOf(type) >= 0) { return createAdaptationSetObject(adaptationSet); }
    }

    return null;
};

getMpd = function(manifestXml) {
    return getDescendantObjectsArrayByName(manifestXml, 'MPD', createMpdObject)[0];
};

// TODO: Move to xmlFun or own module.
getDescendantObjectsArrayByName = function(parentXml, tagName, mapFn) {
    var descendantsXmlArray = Array.prototype.slice.call(parentXml.getElementsByTagName(tagName));
    /*if (typeof mapFn === 'function') { return descendantsXmlArray.map(mapFn); }*/
    if (typeof mapFn === 'function') {
        var mappedElem = descendantsXmlArray.map(mapFn);
        return  mappedElem;
    }
    return descendantsXmlArray;
};

// TODO: Move to xmlFun or own module.
getAncestorObjectByName = function getAncestorObjectByName(xmlNode, tagName, mapFn) {
    if (!tagName || !xmlNode || !xmlNode.parentNode) { return null; }
    if (!xmlNode.parentNode.nodeName) { return null; }

    if (xmlNode.parentNode.nodeName === tagName) {
        return isFunction(mapFn) ? mapFn(xmlNode.parentNode) : xmlNode.parentNode;
    }
    return getAncestorObjectByName(xmlNode.parentNode, tagName, mapFn);
};

module.exports = getMpd;
},{"../../getXmlFun.js":14,"../../util/isArray.js":25,"../../util/isFunction.js":26,"../../util/isString.js":28,"./getDashUtil.js":7}],9:[function(require,module,exports){
'use strict';

var existy = require('../../util/existy.js'),
    getXmlFun = require('../../getXmlFun.js'),
    xmlFun = getXmlFun(),
    getDashUtil = require('../mpd/getDashUtil.js'),
    dashUtil = getDashUtil(),
    parseMediaPresentationDuration = dashUtil.parseMediaPresentationDuration,
    parseDateTime = dashUtil.parseDateTime,
    getSegmentTemplate = require('./getSegmentTemplate'),
    segmentTemplate = getSegmentTemplate(),
    createSegmentListFromTemplate,
    createSegmentFromTemplateByNumber,
    createSegmentFromTemplateByTime,
    createSegmentFromTemplateByUTCWallClockTime,
    getType,
    getIsLive,
    getBandwidth,
    getWidth,
    getHeight,
    getTotalDurationFromTemplate,
    getUTCWallClockStartTimeFromTemplate,
    getTimeShiftBufferDepth,
    getSegmentDurationFromTemplate,
    getTotalSegmentCountFromTemplate,
    getStartNumberFromTemplate,
    getEndNumberFromTemplate;


/**
 *
 * Function used to get the 'type' of a DASH Representation in a format expected by the MSE SourceBuffer. Used to
 * create SourceBuffer instances that correspond to a given MediaSet (e.g. set of audio stream variants, video stream
 * variants, etc.).
 *
 * @param representation    POJO DASH MPD Representation
 * @returns {string}        The Representation's 'type' in a format expected by the MSE SourceBuffer
 */
getType = function(representation) {
    var codecStr = representation.getCodecs();
    var typeStr = representation.getMimeType();

    //NOTE: LEADING ZEROS IN CODEC TYPE/SUBTYPE ARE TECHNICALLY NOT SPEC COMPLIANT, BUT GPAC & OTHER
    // DASH MPD GENERATORS PRODUCE THESE NON-COMPLIANT VALUES. HANDLING HERE FOR NOW.
    // See: RFC 6381 Sec. 3.4 (https://tools.ietf.org/html/rfc6381#section-3.4)
    var parsedCodec = codecStr.split('.').map(function(str) {
        return str.replace(/^0+(?!\.|$)/, '');
    });
    var processedCodecStr = parsedCodec.join('.');

    return (typeStr + ';codecs="' + processedCodecStr + '"');
};

getIsLive = function(representation) {
    return (representation.getMpd().getType() === 'dynamic');
};

getBandwidth = function(representation) {
    var bandwidth = representation.getBandwidth();
    return existy(bandwidth) ? Number(bandwidth) : undefined;
};

getWidth = function(representation) {
    var width = representation.getWidth();
    return existy(width) ? Number(width) : undefined;
};

getHeight = function(representation) {
    var height = representation.getHeight();
    return existy(height) ? Number(height) : undefined;
};

getTotalDurationFromTemplate = function(representation) {
    // TODO: Support period-relative presentation time
    var mediaPresentationDuration = representation.getMpd().getMediaPresentationDuration(),
        parsedMediaPresentationDuration = existy(mediaPresentationDuration) ? parseMediaPresentationDuration(mediaPresentationDuration) : Number.NaN,
        presentationTimeOffset = Number(representation.getSegmentTemplate().getPresentationTimeOffset()) || 0;
    return existy(parsedMediaPresentationDuration) ? Number(parsedMediaPresentationDuration - presentationTimeOffset) : Number.NaN;
};

getUTCWallClockStartTimeFromTemplate = function(representation) {
    var wallClockTimeStr = representation.getMpd().getAvailabilityStartTime(),
        wallClockUnixTimeUtc = parseDateTime(wallClockTimeStr);
    return wallClockUnixTimeUtc;
};

getTimeShiftBufferDepth = function(representation) {
    var timeShiftBufferDepthStr = representation.getMpd().getTimeShiftBufferDepth(),
        parsedTimeShiftBufferDepth = parseMediaPresentationDuration(timeShiftBufferDepthStr);
    return parsedTimeShiftBufferDepth;
};

getSegmentDurationFromTemplate = function(representation) {
    var segmentTemplate = representation.getSegmentTemplate(),
        duration = +segmentTemplate.getDuration(),
        timescale = +segmentTemplate.getTimescale(),
        segments,
        durations;

    if (!duration) {
        segments = segmentTemplate.xml[0].querySelectorAll('S[d]');
        durations = Array.prototype.map.call(segments, function(segment) {
            return +segment.getAttribute('d');
        });
        duration = Math.max.apply(null, durations);
    }

    return duration / timescale;
};

getTotalSegmentCountFromTemplate = function(representation) {
    return Math.ceil(getTotalDurationFromTemplate(representation) / getSegmentDurationFromTemplate(representation));
};

getStartNumberFromTemplate = function(representation) {
    return Number(representation.getSegmentTemplate().getStartNumber());
};

getEndNumberFromTemplate = function(representation) {
    return getTotalSegmentCountFromTemplate(representation) + getStartNumberFromTemplate(representation) - 1;
};

createSegmentListFromTemplate = function(representationXml) {
    return {
        getType: xmlFun.preApplyArgsFn(getType, representationXml),
        getIsLive: xmlFun.preApplyArgsFn(getIsLive, representationXml),
        getBandwidth: xmlFun.preApplyArgsFn(getBandwidth, representationXml),
        getHeight: xmlFun.preApplyArgsFn(getHeight, representationXml),
        getWidth: xmlFun.preApplyArgsFn(getWidth, representationXml),
        getTotalDuration: xmlFun.preApplyArgsFn(getTotalDurationFromTemplate, representationXml),
        getSegmentDuration: xmlFun.preApplyArgsFn(getSegmentDurationFromTemplate, representationXml),
        getUTCWallClockStartTime: xmlFun.preApplyArgsFn(getUTCWallClockStartTimeFromTemplate, representationXml),
        getTimeShiftBufferDepth: xmlFun.preApplyArgsFn(getTimeShiftBufferDepth, representationXml),
        getTotalSegmentCount: xmlFun.preApplyArgsFn(getTotalSegmentCountFromTemplate, representationXml),
        getStartNumber: xmlFun.preApplyArgsFn(getStartNumberFromTemplate, representationXml),
        getEndNumber: xmlFun.preApplyArgsFn(getEndNumberFromTemplate, representationXml),
        // TODO: Externalize
        getInitialization: function() {
            var initialization = {};
            initialization.getUrl = function() {
                var baseUrl = representationXml.getBaseUrl(),
                    representationId = representationXml.getId(),
                    initializationRelativeUrlTemplate = representationXml.getSegmentTemplate().getInitialization(),
                    initializationRelativeUrl = segmentTemplate.replaceIDForTemplate(initializationRelativeUrlTemplate, representationId);

                initializationRelativeUrl = segmentTemplate.replaceTokenForTemplate(initializationRelativeUrl, 'Bandwidth', representationXml.getBandwidth());
                return [baseUrl, initializationRelativeUrl].join('/');
            };
            return initialization;
        },
        getSegmentByNumber: function(number) { return createSegmentFromTemplateByNumber(representationXml, number); },
        getSegmentByTime: function(seconds) { return createSegmentFromTemplateByTime(representationXml, seconds); },
        getSegmentByUTCWallClockTime: function(utcMilliseconds) { return createSegmentFromTemplateByUTCWallClockTime(representationXml, utcMilliseconds); }
    };
};

createSegmentFromTemplateByNumber = function(representation, number) {
    var segment = {};
    segment.getUrl = function() {
        var baseUrl = representation.getBaseUrl(),
            segmentRelativeUrlTemplate = representation.getSegmentTemplate().getMedia(),
            replacedIdUrl = segmentTemplate.replaceIDForTemplate(segmentRelativeUrlTemplate, representation.getId()),
            replacedTokensUrl;
            // TODO: Since $Time$-templated segment URLs should only exist in conjunction w/a <SegmentTimeline>,
            // TODO: can currently assume a $Number$-based templated url.
            // TODO: Enforce min/max number range (based on segmentList startNumber & endNumber)
        replacedTokensUrl = segmentTemplate.replaceTokenForTemplate(replacedIdUrl, 'Number', number);
        replacedTokensUrl = segmentTemplate.replaceTokenForTemplate(replacedTokensUrl, 'Bandwidth', representation.getBandwidth());

      return [baseUrl, replacedTokensUrl].join('/');
    };
    segment.getStartTime = function() {
        return (number - getStartNumberFromTemplate(representation)) * getSegmentDurationFromTemplate(representation);
    };
    segment.getUTCWallClockStartTime = function() {
        return getUTCWallClockStartTimeFromTemplate(representation) + Math.round(((number - getStartNumberFromTemplate(representation)) * getSegmentDurationFromTemplate(representation)) * 1000);
    };
    segment.getDuration = function() {
        // TODO: Verify
        var standardSegmentDuration = getSegmentDurationFromTemplate(representation),
            duration,
            mediaPresentationTime,
            precisionMultiplier;

        if (getEndNumberFromTemplate(representation) === number) {
            mediaPresentationTime = Number(getTotalDurationFromTemplate(representation));
            // Handle floating point precision issue
            precisionMultiplier = 1000;
            duration = (((mediaPresentationTime * precisionMultiplier) % (standardSegmentDuration * precisionMultiplier)) / precisionMultiplier );
        } else {
            duration = standardSegmentDuration;
        }
        return duration;
    };
    segment.getNumber = function() { return number; };
    return segment;
};

createSegmentFromTemplateByTime = function(representation, seconds) {
    var segmentDuration = getSegmentDurationFromTemplate(representation),
        startNumber = getStartNumberFromTemplate(representation) || 0,
        number = Math.floor(seconds / segmentDuration) + startNumber,
        segment = createSegmentFromTemplateByNumber(representation, number);

    // If we're really close to the end time of the current segment (start time + duration),
    // this means we're really close to the start time of the next segment.
    // Therefore, assume this is a floating-point precision issue where we were trying to grab a segment
    // by its start time and return the next segment instead.
    if (((segment.getStartTime() + segment.getDuration()) - seconds) <= 0.003 ) {
        return createSegmentFromTemplateByNumber(representation, number + 1);
    }

    return segment;
};

createSegmentFromTemplateByUTCWallClockTime = function(representation, unixTimeUtcMilliseconds) {
    var wallClockStartTime = getUTCWallClockStartTimeFromTemplate(representation),
        presentationTime;
    if (isNaN(wallClockStartTime)) { return null; }
    presentationTime = (unixTimeUtcMilliseconds - wallClockStartTime)/1000;
    if (isNaN(presentationTime)) { return null; }
    return createSegmentFromTemplateByTime(representation, presentationTime);
};

function getSegmentListForRepresentation(representation) {
    if (!representation) { return undefined; }
    if (representation.getSegmentTemplate()) { return createSegmentListFromTemplate(representation); }
    return undefined;
}

module.exports = getSegmentListForRepresentation;

},{"../../getXmlFun.js":14,"../../util/existy.js":21,"../mpd/getDashUtil.js":7,"./getSegmentTemplate":10}],10:[function(require,module,exports){
'use strict';

var segmentTemplate,
    zeroPadToLength,
    replaceTokenForTemplate,
    unescapeDollarsInTemplate,
    replaceIDForTemplate;

zeroPadToLength = function (numStr, minStrLength) {
    while (numStr.length < minStrLength) {
        numStr = '0' + numStr;
    }

    return numStr;
};

replaceTokenForTemplate = function (templateStr, token, value) {

    var startPos = 0,
        endPos = 0,
        tokenLen = token.length,
        formatTag = '%0',
        formatTagLen = formatTag.length,
        formatTagPos,
        specifier,
        width,
        paddedValue;

    // keep looping round until all instances of <token> have been
    // replaced. once that has happened, startPos below will be -1
    // and the completed url will be returned.
    while (true) {

        // check if there is a valid $<token>...$ identifier
        // if not, return the url as is.
        startPos = templateStr.indexOf('$' + token);
        if (startPos < 0) {
            return templateStr;
        }

        // the next '$' must be the end of the identifer
        // if there isn't one, return the url as is.
        endPos = templateStr.indexOf('$', startPos + tokenLen);
        if (endPos < 0) {
            return templateStr;
        }

        // now see if there is an additional format tag suffixed to
        // the identifier within the enclosing '$' characters
        formatTagPos = templateStr.indexOf(formatTag, startPos + tokenLen);
        if (formatTagPos > startPos && formatTagPos < endPos) {

            specifier = templateStr.charAt(endPos - 1);
            width = parseInt(templateStr.substring(formatTagPos + formatTagLen, endPos - 1), 10);

            // support the minimum specifiers required by IEEE 1003.1
            // (d, i , o, u, x, and X) for completeness
            switch (specifier) {
                // treat all int types as uint,
                // hence deliberate fallthrough
                case 'd':
                case 'i':
                case 'u':
                    paddedValue = zeroPadToLength(value.toString(), width);
                    break;
                case 'x':
                    paddedValue = zeroPadToLength(value.toString(16), width);
                    break;
                case 'X':
                    paddedValue = zeroPadToLength(value.toString(16), width).toUpperCase();
                    break;
                case 'o':
                    paddedValue = zeroPadToLength(value.toString(8), width);
                    break;
                default:
                    console.log('Unsupported/invalid IEEE 1003.1 format identifier string in URL');
                    return templateStr;
            }
        } else {
            paddedValue = value;
        }

        templateStr = templateStr.substring(0, startPos) + paddedValue + templateStr.substring(endPos + 1);
    }
};

unescapeDollarsInTemplate = function (templateStr) {
    return templateStr.split('$$').join('$');
};

replaceIDForTemplate = function (templateStr, value) {
    if (value === null || templateStr.indexOf('$RepresentationID$') === -1) { return templateStr; }
    var v = value.toString();
    return templateStr.split('$RepresentationID$').join(v);
};

segmentTemplate = {
    zeroPadToLength: zeroPadToLength,
    replaceTokenForTemplate: replaceTokenForTemplate,
    unescapeDollarsInTemplate: unescapeDollarsInTemplate,
    replaceIDForTemplate: replaceIDForTemplate
};

module.exports = function getSegmentTemplate() { return segmentTemplate; };
},{}],11:[function(require,module,exports){
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

},{"global/window":1}],12:[function(require,module,exports){
'use strict';

var getEventMgr = require('./getEventManager.js'),
    eventMgr = getEventMgr(),
    eventDispatcherMixin = {
        trigger: function(eventObject) { eventMgr.trigger(this, eventObject); },
        one: function(type, listenerFn) { eventMgr.one(this, type, listenerFn); },
        on: function(type, listenerFn) { eventMgr.on(this, type, listenerFn); },
        off: function(type, listenerFn) { eventMgr.off(this, type, listenerFn); }
    };

module.exports = eventDispatcherMixin;
},{"./getEventManager.js":13}],13:[function(require,module,exports){
'use strict';

var videojs = require('global/window').videojs,
    eventManager = {
        trigger: videojs.trigger,
        one: videojs.one,
        on: videojs.on,
        off: videojs.off
    };

module.exports = function getEventManager() { return eventManager; };

},{"global/window":1}],14:[function(require,module,exports){
'use strict';

// TODO: Refactor to separate js files & modules & remove from here.

var existy = require('./util/existy.js'),
    isFunction = require('./util/isFunction.js'),
    isString = require('./util/isString.js');

// NOTE: This version of truthy allows more values to count
// as "true" than standard JS Boolean operator comparisons.
// Specifically, truthy() will return true for the values
// 0, "", and NaN, whereas JS would treat these as "falsy" values.
function truthy(x) { return (x !== false) && existy(x); }

function preApplyArgsFn(fun /*, args */) {
    var preAppliedArgs = Array.prototype.slice.call(arguments, 1);
    // NOTE: the *this* reference will refer to the closure's context unless
    // the returned function is itself called via .call() or .apply(). If you
    // *need* to refer to instance-level properties, do something like the following:
    //
    // MyType.prototype.someFn = function(argC) { preApplyArgsFn(someOtherFn, argA, argB, ... argN).call(this); };
    //
    // Otherwise, you should be able to just call:
    //
    // MyType.prototype.someFn = preApplyArgsFn(someOtherFn, argA, argB, ... argN);
    //
    // Where possible, functions and methods should not be reaching out to global scope anyway, so...
    return function() { return fun.apply(this, preAppliedArgs); };
}

// Higher-order XML functions

// Takes function(s) as arguments
var getAncestors = function(elem, shouldStopPred) {
    var ancestors = [];
    if (!isFunction(shouldStopPred)) { shouldStopPred = function() { return false; }; }
    (function getAncestorsRecurse(elem) {
        if (shouldStopPred(elem, ancestors)) { return; }
        if (existy(elem) && existy(elem.parentNode)) {
            ancestors.push(elem.parentNode);
            getAncestorsRecurse(elem.parentNode);
        }
        return;
    })(elem);
    return ancestors;
};

// Returns function
var getNodeListByName = function(name) {
    return function(xmlObj) {
        return xmlObj.getElementsByTagName(name);
    };
};

// Returns function
var hasMatchingAttribute = function(attrName, value) {
    if ((typeof attrName !== 'string') || attrName === '') { return undefined; }
    return function(elem) {
        if (!existy(elem) || !existy(elem.hasAttribute) || !existy(elem.getAttribute)) { return false; }
        if (!existy(value)) { return elem.hasAttribute(attrName); }
        return (elem.getAttribute(attrName) === value);
    };
};

// Returns function
var getAttrFn = function(attrName) {
    if (!isString(attrName)) { return undefined; }
    return function(elem) {
        if (!existy(elem) || !isFunction(elem.getAttribute)) { return undefined; }
        return elem.getAttribute(attrName);
    };
};

// Returns function
// TODO: Add shouldStopPred (should function similarly to shouldStopPred in getInheritableElement, below)
var getInheritableAttribute = function(attrName) {
    if ((!isString(attrName)) || attrName === '') { return undefined; }
    return function recurseCheckAncestorAttr(elem) {
        if (!existy(elem) || !existy(elem.hasAttribute) || !existy(elem.getAttribute)) { return undefined; }
        if (elem.hasAttribute(attrName)) { return elem.getAttribute(attrName); }
        if (!existy(elem.parentNode)) { return undefined; }
        return recurseCheckAncestorAttr(elem.parentNode);
    };
};

// Takes function(s) as arguments; Returns function
var getInheritableElement = function(nodeName, shouldStopPred) {
    if ((!isString(nodeName)) || nodeName === '') { return undefined; }
    if (!isFunction(shouldStopPred)) { shouldStopPred = function() { return false; }; }
    return function getInheritableElementRecurse(elem) {
        if (!existy(elem) || !existy(elem.getElementsByTagName)) { return undefined; }
        if (shouldStopPred(elem)) { return undefined; }
        var matchingElemList = elem.getElementsByTagName(nodeName);
        if (existy(matchingElemList) && matchingElemList.length > 0) { return matchingElemList[0]; }
        if (!existy(elem.parentNode)) { return undefined; }
        return getInheritableElementRecurse(elem.parentNode);
    };
};

var getChildElementByNodeName = function(nodeName) {
    if ((!isString(nodeName)) || nodeName === '') { return undefined; }
    return function(elem) {
        if (!existy(elem) || !isFunction(elem.getElementsByTagName)) { return undefined; }
        var initialMatches = elem.getElementsByTagName(nodeName),
            currentElem;
        if (!existy(initialMatches) || initialMatches.length <= 0) { return undefined; }
        currentElem = initialMatches[0];
        return (currentElem.parentNode === elem) ? currentElem : undefined;
    };
};

var getMultiLevelElementList = function(nodeName, shouldStopPred) {
    if ((!isString(nodeName)) || nodeName === '') { return undefined; }
    if (!isFunction(shouldStopPred)) { shouldStopPred = function() { return false; }; }
    var getMatchingChildNodeFn = getChildElementByNodeName(nodeName);
    return function(elem) {
        var currentElem = elem,
            multiLevelElemList = [],
            matchingElem;
        // TODO: Replace w/recursive fn?
        while (existy(currentElem) && !shouldStopPred(currentElem)) {
            matchingElem = getMatchingChildNodeFn(currentElem);
            if (existy(matchingElem)) { multiLevelElemList.push(matchingElem); }
            currentElem = currentElem.parentNode;
        }

        return multiLevelElemList.length > 0 ? multiLevelElemList : undefined;
    };
};

// Publish External API:
var xmlFun = {};
xmlFun.existy = existy;
xmlFun.truthy = truthy;

xmlFun.getNodeListByName = getNodeListByName;
xmlFun.hasMatchingAttribute = hasMatchingAttribute;
xmlFun.getInheritableAttribute = getInheritableAttribute;
xmlFun.getAncestors = getAncestors;
xmlFun.getAttrFn = getAttrFn;
xmlFun.preApplyArgsFn = preApplyArgsFn;
xmlFun.getInheritableElement = getInheritableElement;
xmlFun.getMultiLevelElementList = getMultiLevelElementList;

module.exports = function getXmlFun() { return xmlFun; };
},{"./util/existy.js":21,"./util/isFunction.js":26,"./util/isString.js":28}],15:[function(require,module,exports){
/**
 *
 * main source for packaged code. Auto-bootstraps the source handling functionality by registering the source handler
 * with video.js on initial script load via IIFE. (NOTE: This places an order dependency on the video.js library, which
 * must already be loaded before this script auto-executes.)
 *
 */
;(function() {
    'use strict';

    var root = require('global/window'),
        videojs = root.videojs,
        SourceHandler = require('./SourceHandler'),
        CanHandleSourceEnum = {
            DOESNT_HANDLE_SOURCE: '',
            MAYBE_HANDLE_SOURCE: 'maybe'
        };

    if (!videojs) {
        throw new Error('The video.js library must be included to use this MPEG-DASH source handler.');
    }

    /**
     *
     * Used by a video.js tech instance to verify whether or not a specific media source can be handled by this
     * source handler. In this case, should return 'maybe' if the source is MPEG-DASH, otherwise '' (representing no).
     *
     * @param {object} source           video.js source object providing source uri and type information
     * @returns {CanHandleSourceEnum}   string representation of whether or not particular source can be handled by this
     *                                  source handler.
     */
    function canHandleSource(source) {
        // Requires Media Source Extensions
        if (!(root.MediaSource)) {
            return CanHandleSourceEnum.DOESNT_HANDLE_SOURCE;
        }

        // Check if the type is supported
        if (/application\/dash\+xml/.test(source.type)) {
            return CanHandleSourceEnum.MAYBE_HANDLE_SOURCE;
        }

        // Check if the file extension matches
        if (/\.mpd$/i.test(source.src)) {
            return CanHandleSourceEnum.MAYBE_HANDLE_SOURCE;
        }

        return CanHandleSourceEnum.DOESNT_HANDLE_SOURCE;
    }

    /**
     *
     * Called by a video.js tech instance to handle a specific media source, returning an object instance that provides
     * the context for handling said source.
     *
     * @param source            video.js source object providing source uri and type information
     * @param tech              video.js tech object (in this case, should be Html5 tech) providing point of interaction
     *                          between the source handler and the video.js library (including, e.g., the video element)
     * @returns {SourceHandler} An object that defines context for handling a particular MPEG-DASH source.
     */
    function handleSource(source, tech) {
        return new SourceHandler(source, tech);
    }

    // Register the source handler to the Html5 tech instance.
    videojs.Html5.registerSourceHandler({
        canHandleSource: canHandleSource,
        handleSource: handleSource
    }, 0);

}.call(this));

},{"./SourceHandler":6,"global/window":1}],16:[function(require,module,exports){
'use strict';

var existy = require('../util/existy.js'),
    truthy = require('../util/truthy.js'),
    isString = require('../util/isString.js'),
    isFunction = require('../util/isFunction.js'),
    isArray = require('../util/isArray.js'),
    findElementInArray = require('../util/findElementInArray.js'),
    getMediaTypeFromMimeType = require('../util/getMediaTypeFromMimeType.js'),
    loadManifest = require('./loadManifest.js'),
    extendObject = require('../util/extendObject.js'),
    getDashUtil = require('../dash/mpd/getDashUtil.js'),
    dashUtil = getDashUtil(),
    parseMediaPresentationDuration = dashUtil.parseMediaPresentationDuration,
    EventDispatcherMixin = require('../events/EventDispatcherMixin.js'),
    getMpd = require('../dash/mpd/getMpd.js'),
    MediaSet = require('../MediaSet.js'),
    mediaTypes = require('./MediaTypes.js');

/**
 *
 * The ManifestController loads, stores, and provides data views for the MPD manifest that represents the
 * MPEG-DASH media source being handled.
 *
 * @param sourceUri {string}
 * @param autoLoad  {boolean}
 * @constructor
 */
function ManifestController(sourceUri, autoLoad) {
    this.__autoLoad = truthy(autoLoad);
    this.setSourceUri(sourceUri);
}

/**
 * Enumeration of events instances of this object will dispatch.
 */
ManifestController.prototype.eventList = {
    MANIFEST_LOADED: 'manifestLoaded'
};

ManifestController.prototype.getSourceUri = function() {
    return this.__sourceUri;
};

ManifestController.prototype.setSourceUri = function setSourceUri(sourceUri) {
    // TODO: 'existy()' check for both?
    if (sourceUri === this.__sourceUri) { return; }

    // TODO: isString() check? 'existy()' check?
    if (!sourceUri) {
        this.__clearSourceUri();
        return;
    }

    // Need to potentially remove update interval for re-requesting the MPD manifest (in case it is a dynamic MPD)
    this.__clearCurrentUpdateInterval();
    this.__sourceUri = sourceUri;
    // If we should automatically load the MPD, go ahead and kick off loading it.
    if (this.__autoLoad) {
        // TODO: Impl any cleanup functionality appropriate before load.
        this.load();
    }
};

ManifestController.prototype.__clearSourceUri = function clearSourceUri() {
    this.__sourceUri = null;
    // Need to potentially remove update interval for re-requesting the MPD manifest (in case it is a dynamic MPD)
    this.__clearCurrentUpdateInterval();
    // TODO: impl any other cleanup functionality
};

/**
 * Kick off loading the DASH MPD Manifest (served @ the ManifestController instance's __sourceUri)
 */
ManifestController.prototype.load = function load() {
    // TODO: Currently clearing & re-setting update interval after every request. Either use setTimeout() or only setup interval once
    var self = this;
    loadManifest(self.__sourceUri, function(data) {
        self.__manifest = data.manifestXml;
        // (Potentially) setup the update interval for re-requesting the MPD (in case the manifest is dynamic)
        self.__setupUpdateInterval();
        // Dispatch event to notify that the manifest has loaded.
        self.trigger({ type:self.eventList.MANIFEST_LOADED, target:self, data:self.__manifest});
    });
};

/**
 * 'Private' method that removes the update interval (if it exists), so the ManifestController instance will no longer
 * periodically re-request the manifest (if it's dynamic).
 */
ManifestController.prototype.__clearCurrentUpdateInterval = function clearCurrentUpdateInterval() {
    if (!existy(this.__updateInterval)) { return; }
    clearInterval(this.__updateInterval);
};

/**
 * Sets up an interval to re-request the manifest (if it's dynamic)
 */
ManifestController.prototype.__setupUpdateInterval = function setupUpdateInterval() {
    // If there's already an updateInterval function, remove it.
    if (this.__updateInterval) { this.__clearCurrentUpdateInterval(); }
    // If we shouldn't update, just bail.
    if (!this.getShouldUpdate()) { return; }
    var self = this,
        minUpdateRate = 2,
        updateRate = Math.max(this.getUpdateRate(), minUpdateRate);
    // Setup the update interval based on the update rate (determined from the manifest) or the minimum update rate
    // (whichever's larger).
    // NOTE: Must store ref to created interval to potentially clear/remove it later
    this.__updateInterval = setInterval(function() {
        self.load();
    }, updateRate * 1000);
};

/**
 * Gets the type of playlist ('static' or 'dynamic', which nearly invariably corresponds to live vs. vod) defined in the
 * manifest.
 *
 * @returns {string}    the playlist type (either 'static' or 'dynamic')
 */
ManifestController.prototype.getPlaylistType = function getPlaylistType() {
    var playlistType = getMpd(this.__manifest).getType();
    return playlistType;
};

ManifestController.prototype.getUpdateRate = function getUpdateRate() {
    var minimumUpdatePeriodStr = getMpd(this.__manifest).getMinimumUpdatePeriod(),
        minimumUpdatePeriod = parseMediaPresentationDuration(minimumUpdatePeriodStr);
    return minimumUpdatePeriod || 0;
};

ManifestController.prototype.getShouldUpdate = function getShouldUpdate() {
    var isDynamic = (this.getPlaylistType() === 'dynamic'),
        hasValidUpdateRate = (this.getUpdateRate() > 0);
    return (isDynamic && hasValidUpdateRate);
};

ManifestController.prototype.getMpd = function() {
    return getMpd(this.__manifest);
};

/**
 *
 * @param type
 * @returns {MediaSet}
 */
ManifestController.prototype.getMediaSetByType = function getMediaSetByType(type) {
    var adaptationSet;
    if (mediaTypes.indexOf(type) < 0) {
        throw new Error('Invalid type. Value must be one of: ' + mediaTypes.join(', '));
    }
    // find the first adaptation set that has a mime type compatible
    // with "type" specified on itself or one of its child
    // representations
    adaptationSet = getMpd(this.__manifest).getPeriods()[0].getAdaptationSets()
        .filter(function(adaptationSet) {
            var mimeType = adaptationSet.xml.getAttribute('mimeType') || '';
            if (mimeType.indexOf(type) === 0) {
                return adaptationSet;
            }
            return adaptationSet.xml
                .querySelector('Representation[mimeType^="' + type + '"]');
        })[0];
    return adaptationSet ? new MediaSet(adaptationSet) : null;
};

/**
 *
 * @returns {Array.<MediaSet>}
 */
ManifestController.prototype.getMediaSets = function getMediaSets() {
    var adaptationSets = getMpd(this.__manifest).getPeriods()[0].getAdaptationSets(),
        mediaSets = adaptationSets.map(function(adaptationSet) { return new MediaSet(adaptationSet); });
    return mediaSets;
};

// Mixin event handling for the ManifestController object type definition.
extendObject(ManifestController.prototype, EventDispatcherMixin);

module.exports = ManifestController;

},{"../MediaSet.js":2,"../dash/mpd/getDashUtil.js":7,"../dash/mpd/getMpd.js":8,"../events/EventDispatcherMixin.js":12,"../util/existy.js":21,"../util/extendObject.js":22,"../util/findElementInArray.js":23,"../util/getMediaTypeFromMimeType.js":24,"../util/isArray.js":25,"../util/isFunction.js":26,"../util/isString.js":28,"../util/truthy.js":29,"./MediaTypes.js":17,"./loadManifest.js":18}],17:[function(require,module,exports){
module.exports = ['video', 'audio'];
},{}],18:[function(require,module,exports){
'use strict';

var getDashUtil = require('../dash/mpd/getDashUtil.js'),
    dashUtil = getDashUtil(),
    parseRootUrl = dashUtil.parseRootUrl;

function loadManifest(url, callback) {
    var actualUrl = parseRootUrl(url),
        request = new XMLHttpRequest(),
        onload;

    request.overrideMimeType('application/xml');

    onload = function () {
        if (request.status < 200 || request.status > 299) { return; }

        if (typeof callback === 'function') { callback({manifestXml: request.responseXML }); }
    };

    try {
        request.onload = onload;
        request.open('GET', url, true);
        request.send();
    } catch(e) {
        request.onerror(e);
    }
}

module.exports = loadManifest;

},{"../dash/mpd/getDashUtil.js":7}],19:[function(require,module,exports){
'use strict';

var isFunction = require('../util/isFunction.js');

/**
 * Generic function for loading MPEG-DASH segments (including initialization segments)
 * @param segment {object}       data view representing a segment (and relevant data for that segment)
 * @param successFn {function}  function called on successful response
 * @param failFn {function}     function called on failed response
 * @param thisArg {object}      object used as the this context for successFn and failFn
 */
function loadSegment(segment, successFn, failFn, thisArg) {
    var request = new XMLHttpRequest(),
        url = segment.getUrl();

    function onload() {
        // If the load status was outside of the 200s range, consider it a failed request.
        if (request.status < 200 || request.status > 299) {
            if (isFunction(failFn)) {
                failFn.call(thisArg,  {
                    requestedSegment: segment,
                    response: request.response,
                    status: request.status
                });
            }
        } else {
            if (isFunction(successFn)) {
                successFn.call(thisArg, {
                    requestedSegment: segment,
                    response: request.response,
                    status: request.status
                });
            }
        }
    }

    function onerror() {
        if (isFunction(failFn)) {
            failFn.call(thisArg,  {
                requestedSegment: segment,
                response: request.response,
                status: request.status
            });
        }
    }

    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.onload = onload;
    request.onerror = onerror;
    request.send();

    return request;
}

module.exports = loadSegment;
},{"../util/isFunction.js":26}],20:[function(require,module,exports){
'use strict';

function compareSegmentListsByBandwidthAscending(segmentListA, segmentListB) {
    var bandwidthA = segmentListA.getBandwidth(),
        bandwidthB = segmentListB.getBandwidth();
    return bandwidthA - bandwidthB;
}

function compareSegmentListsByWidthAscending(segmentListA, segmentListB) {
    var widthA = segmentListA.getWidth() || 0,
        widthB = segmentListB.getWidth() || 0;
    return widthA - widthB;
}

function compareSegmentListsByWidthThenBandwidthAscending(segmentListA, segmentListB) {
    var resolutionCompare = compareSegmentListsByWidthAscending(segmentListA, segmentListB);
    return (resolutionCompare !== 0) ? resolutionCompare : compareSegmentListsByBandwidthAscending(segmentListA, segmentListB);
}

function filterSegmentListsByResolution(segmentList, maxWidth, maxHeight) {
    var width = segmentList.getWidth() || 0,
        height = segmentList.getHeight() || 0;
    return ((width <= maxWidth) && (height <= maxHeight));
}

function filterSegmentListsByDownloadRate(segmentList, currentSegmentListBandwidth, downloadRateRatio) {
    var segmentListBandwidth = segmentList.getBandwidth(),
        segmentBandwidthRatio = segmentListBandwidth / currentSegmentListBandwidth;
    downloadRateRatio = downloadRateRatio || Number.MAX_VALUE;
    return (downloadRateRatio >= segmentBandwidthRatio);
}

// NOTE: Passing in mediaSet instead of mediaSet's SegmentList Array since sort is destructive and don't want to clone.
//      Also allows for greater flexibility of fn.
function selectSegmentList(mediaSet, data) {
    var downloadRateRatio = data.downloadRateRatio,
        currentSegmentListBandwidth = data.currentSegmentListBandwidth,
        width = data.width,
        height = data.height,
        sortedByBandwidth = mediaSet.getSegmentLists().sort(compareSegmentListsByBandwidthAscending),
        filteredByDownloadRate,
        filteredByResolution,
        proposedSegmentList;

    function filterByResolution(segmentList) {
        return filterSegmentListsByResolution(segmentList, width, height);
    }

    function filterByDownloadRate(segmentList) {
        return filterSegmentListsByDownloadRate(segmentList, currentSegmentListBandwidth, downloadRateRatio);
    }

    filteredByDownloadRate = sortedByBandwidth.filter(filterByDownloadRate);
    filteredByResolution = filteredByDownloadRate.sort(compareSegmentListsByWidthThenBandwidthAscending).filter(filterByResolution);

    proposedSegmentList = filteredByResolution[filteredByResolution.length - 1] || sortedByBandwidth[0];

    return proposedSegmentList;
}

module.exports = selectSegmentList;
},{}],21:[function(require,module,exports){
'use strict';

function existy(x) { return (x !== null) && (x !== undefined); }

module.exports = existy;
},{}],22:[function(require,module,exports){
'use strict';

// Extend a given object with all the properties (and their values) found in the passed-in object(s).
var extendObject = function(obj /*, extendObject1, extendObject2, ..., extendObjectN */) {
    var extendObjectsArray = Array.prototype.slice.call(arguments, 1),
        i,
        length = extendObjectsArray.length,
        extendObject;

    for(i=0; i<length; i++) {
        extendObject = extendObjectsArray[i];
        if (extendObject) {
            for (var prop in extendObject) {
                obj[prop] = extendObject[prop];
            }
        }
    }

    return obj;
};

module.exports = extendObject;
},{}],23:[function(require,module,exports){
'use strict';

var isArray = require('./isArray.js'),
    isFunction = require('./isFunction.js'),
    findElementInArray;

findElementInArray = function(array, predicateFn) {
    if (!isArray(array) || !isFunction(predicateFn)) { return undefined; }
    var i,
        length = array.length,
        elem;

    for (i=0; i<length; i++) {
        elem = array[i];
        if (predicateFn(elem, i, array)) { return elem; }
    }

    return undefined;
};

module.exports = findElementInArray;
},{"./isArray.js":25,"./isFunction.js":26}],24:[function(require,module,exports){
'use strict';

var existy = require('./existy.js'),
    isString = require('./isString.js'),
    findElementInArray = require('./findElementInArray.js'),
    getMediaTypeFromMimeType;

/**
 *
 * Function used to get the media type based on the mime type. Used to determine the media type of Adaptation Sets
 * or corresponding data representations.
 *
 * @param mimeType {string} mime type for a DASH MPD Adaptation Set (specified as an attribute string)
 * @param types {string}    supported media types (e.g. 'video,' 'audio,')
 * @returns {string}        the media type that corresponds to the mime type.
 */
getMediaTypeFromMimeType = function(mimeType, types) {
    if (!isString(mimeType)) { return null; }   // TODO: Throw error?
    var matchedType = findElementInArray(types, function(type) {
        return (!!mimeType && mimeType.indexOf(type) >= 0);
    });

    return matchedType;
};

module.exports = getMediaTypeFromMimeType;
},{"./existy.js":21,"./findElementInArray.js":23,"./isString.js":28}],25:[function(require,module,exports){
'use strict';

var genericObjType = function(){},
    objectRef = new genericObjType();

function isArray(obj) {
    return objectRef.toString.call(obj) === '[object Array]';
}

module.exports = isArray;
},{}],26:[function(require,module,exports){
'use strict';

var genericObjType = function(){},
    objectRef = new genericObjType();

var isFunction = function isFunction(value) {
    return typeof value === 'function';
};
// fallback for older versions of Chrome and Safari
if (isFunction(/x/)) {
    isFunction = function(value) {
        return typeof value === 'function' && objectRef.toString.call(value) === '[object Function]';
    };
}

module.exports = isFunction;
},{}],27:[function(require,module,exports){
'use strict';

var genericObjType = function(){},
    objectRef = new genericObjType();

function isNumber(value) {
    return typeof value === 'number' ||
        value && typeof value === 'object' && objectRef.toString.call(value) === '[object Number]' || false;
}

module.exports = isNumber;
},{}],28:[function(require,module,exports){
'use strict';

var genericObjType = function(){},
    objectRef = new genericObjType();

var isString = function isString(value) {
    return typeof value === 'string' ||
        value && typeof value === 'object' && objectRef.toString.call(value) === '[object String]' || false;
};

module.exports = isString;
},{}],29:[function(require,module,exports){
'use strict';

var existy = require('./existy.js');

// NOTE: This version of truthy allows more values to count
// as "true" than standard JS Boolean operator comparisons.
// Specifically, truthy() will return true for the values
// 0, "", and NaN, whereas JS would treat these as "falsy" values.
function truthy(x) { return (x !== false) && existy(x); }

module.exports = truthy;
},{"./existy.js":21}]},{},[15])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZ2xvYmFsL3dpbmRvdy5qcyIsInNyYy9qcy9NZWRpYVNldC5qcyIsInNyYy9qcy9NZWRpYVR5cGVMb2FkZXIuanMiLCJzcmMvanMvUGxheWxpc3RMb2FkZXIuanMiLCJzcmMvanMvU291cmNlQnVmZmVyRGF0YVF1ZXVlLmpzIiwic3JjL2pzL1NvdXJjZUhhbmRsZXIuanMiLCJzcmMvanMvZGFzaC9tcGQvZ2V0RGFzaFV0aWwuanMiLCJzcmMvanMvZGFzaC9tcGQvZ2V0TXBkLmpzIiwic3JjL2pzL2Rhc2gvc2VnbWVudHMvZ2V0U2VnbWVudExpc3RGb3JSZXByZXNlbnRhdGlvbi5qcyIsInNyYy9qcy9kYXNoL3NlZ21lbnRzL2dldFNlZ21lbnRUZW1wbGF0ZS5qcyIsInNyYy9qcy9kZWNyeXB0ZXIuanMiLCJzcmMvanMvZXZlbnRzL0V2ZW50RGlzcGF0Y2hlck1peGluLmpzIiwic3JjL2pzL2V2ZW50cy9nZXRFdmVudE1hbmFnZXIuanMiLCJzcmMvanMvZ2V0WG1sRnVuLmpzIiwic3JjL2pzL21haW4uanMiLCJzcmMvanMvbWFuaWZlc3QvTWFuaWZlc3RDb250cm9sbGVyLmpzIiwic3JjL2pzL21hbmlmZXN0L01lZGlhVHlwZXMuanMiLCJzcmMvanMvbWFuaWZlc3QvbG9hZE1hbmlmZXN0LmpzIiwic3JjL2pzL3NlZ21lbnRzL2xvYWRTZWdtZW50LmpzIiwic3JjL2pzL3NlbGVjdFNlZ21lbnRMaXN0LmpzIiwic3JjL2pzL3V0aWwvZXhpc3R5LmpzIiwic3JjL2pzL3V0aWwvZXh0ZW5kT2JqZWN0LmpzIiwic3JjL2pzL3V0aWwvZmluZEVsZW1lbnRJbkFycmF5LmpzIiwic3JjL2pzL3V0aWwvZ2V0TWVkaWFUeXBlRnJvbU1pbWVUeXBlLmpzIiwic3JjL2pzL3V0aWwvaXNBcnJheS5qcyIsInNyYy9qcy91dGlsL2lzRnVuY3Rpb24uanMiLCJzcmMvanMvdXRpbC9pc051bWJlci5qcyIsInNyYy9qcy91dGlsL2lzU3RyaW5nLmpzIiwic3JjL2pzL3V0aWwvdHJ1dGh5LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOU9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIG1vZHVsZS5leHBvcnRzID0gd2luZG93O1xufSBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBnbG9iYWw7XG59IGVsc2UgaWYgKHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiKXtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHNlbGY7XG59IGVsc2Uge1xuICAgIG1vZHVsZS5leHBvcnRzID0ge307XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBleGlzdHkgPSByZXF1aXJlKCcuL3V0aWwvZXhpc3R5LmpzJyksXG4gICAgZ2V0TWVkaWFUeXBlRnJvbU1pbWVUeXBlID0gcmVxdWlyZSgnLi91dGlsL2dldE1lZGlhVHlwZUZyb21NaW1lVHlwZS5qcycpLFxuICAgIGdldFNlZ21lbnRMaXN0Rm9yUmVwcmVzZW50YXRpb24gPSByZXF1aXJlKCcuL2Rhc2gvc2VnbWVudHMvZ2V0U2VnbWVudExpc3RGb3JSZXByZXNlbnRhdGlvbi5qcycpLFxuICAgIGZpbmRFbGVtZW50SW5BcnJheSA9IHJlcXVpcmUoJy4vdXRpbC9maW5kRWxlbWVudEluQXJyYXkuanMnKSxcbiAgICBtZWRpYVR5cGVzID0gcmVxdWlyZSgnLi9tYW5pZmVzdC9NZWRpYVR5cGVzLmpzJyk7XG5cbi8qKlxuICpcbiAqIFByaW1hcnkgZGF0YSB2aWV3IGZvciByZXByZXNlbnRpbmcgdGhlIHNldCBvZiBzZWdtZW50IGxpc3RzIGFuZCBvdGhlciBnZW5lcmFsIGluZm9ybWF0aW9uIGZvciBhIGdpdmUgbWVkaWEgdHlwZVxuICogKGUuZy4gJ2F1ZGlvJyBvciAndmlkZW8nKS5cbiAqXG4gKiBAcGFyYW0gYWRhcHRhdGlvblNldCBUaGUgTVBFRy1EQVNIIGNvcnJlbGF0ZSBmb3IgYSBnaXZlbiBtZWRpYSBzZXQsIGNvbnRhaW5pbmcgc29tZSB3YXkgb2YgcmVwcmVzZW50YXRpbmcgc2VnbWVudCBsaXN0c1xuICogICAgICAgICAgICAgICAgICAgICAgYW5kIGEgc2V0IG9mIHJlcHJlc2VudGF0aW9ucyBmb3IgZWFjaCBzdHJlYW0gdmFyaWFudC5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBNZWRpYVNldChhZGFwdGF0aW9uU2V0KSB7XG4gICAgLy8gVE9ETzogQWRkaXRpb25hbCBjaGVja3MgJiBFcnJvciBUaHJvd2luZ1xuICAgIHRoaXMuX19hZGFwdGF0aW9uU2V0ID0gYWRhcHRhdGlvblNldDtcbn1cblxuTWVkaWFTZXQucHJvdG90eXBlLmdldE1lZGlhVHlwZSA9IGZ1bmN0aW9uIGdldE1lZGlhVHlwZSgpIHtcbiAgICB2YXIgdHlwZSA9IGdldE1lZGlhVHlwZUZyb21NaW1lVHlwZSh0aGlzLmdldE1pbWVUeXBlKCksIG1lZGlhVHlwZXMpO1xuICAgIHJldHVybiB0eXBlO1xufTtcblxuTWVkaWFTZXQucHJvdG90eXBlLmdldE1pbWVUeXBlID0gZnVuY3Rpb24gZ2V0TWltZVR5cGUoKSB7XG4gICAgdmFyIG1pbWVUeXBlID0gdGhpcy5fX2FkYXB0YXRpb25TZXQuZ2V0TWltZVR5cGUoKTtcbiAgICByZXR1cm4gbWltZVR5cGU7XG59O1xuXG5NZWRpYVNldC5wcm90b3R5cGUuZ2V0U291cmNlQnVmZmVyVHlwZSA9IGZ1bmN0aW9uIGdldFNvdXJjZUJ1ZmZlclR5cGUoKSB7XG4gICAgLy8gTk9URTogQ3VycmVudGx5IGFzc3VtaW5nIHRoZSBjb2RlY3MgYXNzb2NpYXRlZCB3aXRoIGVhY2ggc3RyZWFtIHZhcmlhbnQvcmVwcmVzZW50YXRpb25cbiAgICAvLyB3aWxsIGJlIHNpbWlsYXIgZW5vdWdoIHRoYXQgeW91IHdvbid0IGhhdmUgdG8gcmUtY3JlYXRlIHRoZSBzb3VyY2UtYnVmZmVyIHdoZW4gc3dpdGNoaW5nXG4gICAgLy8gYmV0d2VlbiB0aGVtLlxuXG4gICAgdmFyIHJlcHJlc2VudGF0aW9uID0gdGhpcy5fX2FkYXB0YXRpb25TZXQuZ2V0UmVwcmVzZW50YXRpb25zKClbMF0sXG4gICAgICAgIHNlZ21lbnRMaXN0ID0gZ2V0U2VnbWVudExpc3RGb3JSZXByZXNlbnRhdGlvbihyZXByZXNlbnRhdGlvbik7XG4gICAgcmV0dXJuIHNlZ21lbnRMaXN0LmdldFR5cGUoKTtcbn07XG5cbk1lZGlhU2V0LnByb3RvdHlwZS5nZXRUb3RhbER1cmF0aW9uID0gZnVuY3Rpb24gZ2V0VG90YWxEdXJhdGlvbigpIHtcbiAgICB2YXIgcmVwcmVzZW50YXRpb24gPSB0aGlzLl9fYWRhcHRhdGlvblNldC5nZXRSZXByZXNlbnRhdGlvbnMoKVswXSxcbiAgICAgICAgc2VnbWVudExpc3QgPSBnZXRTZWdtZW50TGlzdEZvclJlcHJlc2VudGF0aW9uKHJlcHJlc2VudGF0aW9uKSxcbiAgICAgICAgdG90YWxEdXJhdGlvbiA9IHNlZ21lbnRMaXN0LmdldFRvdGFsRHVyYXRpb24oKTtcbiAgICByZXR1cm4gdG90YWxEdXJhdGlvbjtcbn07XG5cbk1lZGlhU2V0LnByb3RvdHlwZS5nZXRVVENXYWxsQ2xvY2tTdGFydFRpbWUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcmVwcmVzZW50YXRpb24gPSB0aGlzLl9fYWRhcHRhdGlvblNldC5nZXRSZXByZXNlbnRhdGlvbnMoKVswXSxcbiAgICAgICAgc2VnbWVudExpc3QgPSBnZXRTZWdtZW50TGlzdEZvclJlcHJlc2VudGF0aW9uKHJlcHJlc2VudGF0aW9uKSxcbiAgICAgICAgd2FsbENsb2NrVGltZSA9IHNlZ21lbnRMaXN0LmdldFVUQ1dhbGxDbG9ja1N0YXJ0VGltZSgpO1xuICAgIHJldHVybiB3YWxsQ2xvY2tUaW1lO1xufTtcblxuLy8gTk9URTogQ3VycmVudGx5IGFzc3VtaW5nIHRoZXNlIHZhbHVlcyB3aWxsIGJlIGNvbnNpc3RlbnQgYWNyb3NzIGFsbCByZXByZXNlbnRhdGlvbnMuIFdoaWxlIHRoaXMgaXMgKnVzdWFsbHkqXG4vLyB0aGUgY2FzZSwgdGhlIHNwZWMgKmRvZXMqIGFsbG93IHNlZ21lbnRzIHRvIG5vdCBhbGlnbiBhY3Jvc3MgcmVwcmVzZW50YXRpb25zLlxuLy8gU2VlLCBmb3IgZXhhbXBsZTogQHNlZ21lbnRBbGlnbm1lbnQgQWRhcHRhdGlvblNldCBhdHRyaWJ1dGUsIElTTyBJRUMgMjMwMDktMSBTZWMuIDUuMy4zLjIsIHBwIDI0LTUuXG5NZWRpYVNldC5wcm90b3R5cGUuZ2V0VG90YWxTZWdtZW50Q291bnQgPSBmdW5jdGlvbiBnZXRUb3RhbFNlZ21lbnRDb3VudCgpIHtcbiAgICB2YXIgcmVwcmVzZW50YXRpb24gPSB0aGlzLl9fYWRhcHRhdGlvblNldC5nZXRSZXByZXNlbnRhdGlvbnMoKVswXSxcbiAgICAgICAgc2VnbWVudExpc3QgPSBnZXRTZWdtZW50TGlzdEZvclJlcHJlc2VudGF0aW9uKHJlcHJlc2VudGF0aW9uKSxcbiAgICAgICAgdG90YWxTZWdtZW50Q291bnQgPSBzZWdtZW50TGlzdC5nZXRUb3RhbFNlZ21lbnRDb3VudCgpO1xuICAgIHJldHVybiB0b3RhbFNlZ21lbnRDb3VudDtcbn07XG5cbi8vIE5PVEU6IEN1cnJlbnRseSBhc3N1bWluZyB0aGVzZSB2YWx1ZXMgd2lsbCBiZSBjb25zaXN0ZW50IGFjcm9zcyBhbGwgcmVwcmVzZW50YXRpb25zLiBXaGlsZSB0aGlzIGlzICp1c3VhbGx5KlxuLy8gdGhlIGNhc2UgaW4gYWN0dWFsIHByYWN0aWNlLCB0aGUgc3BlYyAqZG9lcyogYWxsb3cgc2VnbWVudHMgdG8gbm90IGFsaWduIGFjcm9zcyByZXByZXNlbnRhdGlvbnMuXG4vLyBTZWUsIGZvciBleGFtcGxlOiBAc2VnbWVudEFsaWdubWVudCBBZGFwdGF0aW9uU2V0IGF0dHJpYnV0ZSwgSVNPIElFQyAyMzAwOS0xIFNlYy4gNS4zLjMuMiwgcHAgMjQtNS5cbk1lZGlhU2V0LnByb3RvdHlwZS5nZXRTZWdtZW50RHVyYXRpb24gPSBmdW5jdGlvbiBnZXRTZWdtZW50RHVyYXRpb24oKSB7XG4gICAgdmFyIHJlcHJlc2VudGF0aW9uID0gdGhpcy5fX2FkYXB0YXRpb25TZXQuZ2V0UmVwcmVzZW50YXRpb25zKClbMF0sXG4gICAgICAgIHNlZ21lbnRMaXN0ID0gZ2V0U2VnbWVudExpc3RGb3JSZXByZXNlbnRhdGlvbihyZXByZXNlbnRhdGlvbiksXG4gICAgICAgIHNlZ21lbnREdXJhdGlvbiA9IHNlZ21lbnRMaXN0LmdldFNlZ21lbnREdXJhdGlvbigpO1xuICAgIHJldHVybiBzZWdtZW50RHVyYXRpb247XG59O1xuXG4vLyBOT1RFOiBDdXJyZW50bHkgYXNzdW1pbmcgdGhlc2UgdmFsdWVzIHdpbGwgYmUgY29uc2lzdGVudCBhY3Jvc3MgYWxsIHJlcHJlc2VudGF0aW9ucy4gV2hpbGUgdGhpcyBpcyAqdXN1YWxseSpcbi8vIHRoZSBjYXNlIGluIGFjdHVhbCBwcmFjdGljZSwgdGhlIHNwZWMgKmRvZXMqIGFsbG93IHNlZ21lbnRzIHRvIG5vdCBhbGlnbiBhY3Jvc3MgcmVwcmVzZW50YXRpb25zLlxuLy8gU2VlLCBmb3IgZXhhbXBsZTogQHNlZ21lbnRBbGlnbm1lbnQgQWRhcHRhdGlvblNldCBhdHRyaWJ1dGUsIElTTyBJRUMgMjMwMDktMSBTZWMuIDUuMy4zLjIsIHBwIDI0LTUuXG5NZWRpYVNldC5wcm90b3R5cGUuZ2V0U2VnbWVudExpc3RTdGFydE51bWJlciA9IGZ1bmN0aW9uIGdldFNlZ21lbnRMaXN0U3RhcnROdW1iZXIoKSB7XG4gICAgdmFyIHJlcHJlc2VudGF0aW9uID0gdGhpcy5fX2FkYXB0YXRpb25TZXQuZ2V0UmVwcmVzZW50YXRpb25zKClbMF0sXG4gICAgICAgIHNlZ21lbnRMaXN0ID0gZ2V0U2VnbWVudExpc3RGb3JSZXByZXNlbnRhdGlvbihyZXByZXNlbnRhdGlvbiksXG4gICAgICAgIHNlZ21lbnRMaXN0U3RhcnROdW1iZXIgPSBzZWdtZW50TGlzdC5nZXRTdGFydE51bWJlcigpO1xuICAgIHJldHVybiBzZWdtZW50TGlzdFN0YXJ0TnVtYmVyO1xufTtcblxuLy8gTk9URTogQ3VycmVudGx5IGFzc3VtaW5nIHRoZXNlIHZhbHVlcyB3aWxsIGJlIGNvbnNpc3RlbnQgYWNyb3NzIGFsbCByZXByZXNlbnRhdGlvbnMuIFdoaWxlIHRoaXMgaXMgKnVzdWFsbHkqXG4vLyB0aGUgY2FzZSBpbiBhY3R1YWwgcHJhY3RpY2UsIHRoZSBzcGVjICpkb2VzKiBhbGxvdyBzZWdtZW50cyB0byBub3QgYWxpZ24gYWNyb3NzIHJlcHJlc2VudGF0aW9ucy5cbi8vIFNlZSwgZm9yIGV4YW1wbGU6IEBzZWdtZW50QWxpZ25tZW50IEFkYXB0YXRpb25TZXQgYXR0cmlidXRlLCBJU08gSUVDIDIzMDA5LTEgU2VjLiA1LjMuMy4yLCBwcCAyNC01LlxuTWVkaWFTZXQucHJvdG90eXBlLmdldFNlZ21lbnRMaXN0RW5kTnVtYmVyID0gZnVuY3Rpb24gZ2V0U2VnbWVudExpc3RFbmROdW1iZXIoKSB7XG4gICAgdmFyIHJlcHJlc2VudGF0aW9uID0gdGhpcy5fX2FkYXB0YXRpb25TZXQuZ2V0UmVwcmVzZW50YXRpb25zKClbMF0sXG4gICAgICAgIHNlZ21lbnRMaXN0ID0gZ2V0U2VnbWVudExpc3RGb3JSZXByZXNlbnRhdGlvbihyZXByZXNlbnRhdGlvbiksXG4gICAgICAgIHNlZ21lbnRMaXN0RW5kTnVtYmVyID0gc2VnbWVudExpc3QuZ2V0RW5kTnVtYmVyKCk7XG4gICAgcmV0dXJuIHNlZ21lbnRMaXN0RW5kTnVtYmVyO1xufTtcblxuXG5NZWRpYVNldC5wcm90b3R5cGUuZ2V0U2VnbWVudExpc3RzID0gZnVuY3Rpb24gZ2V0U2VnbWVudExpc3RzKCkge1xuICAgIHZhciByZXByZXNlbnRhdGlvbnMgPSB0aGlzLl9fYWRhcHRhdGlvblNldC5nZXRSZXByZXNlbnRhdGlvbnMoKSxcbiAgICAgICAgc2VnbWVudExpc3RzID0gcmVwcmVzZW50YXRpb25zLm1hcChnZXRTZWdtZW50TGlzdEZvclJlcHJlc2VudGF0aW9uKTtcbiAgICByZXR1cm4gc2VnbWVudExpc3RzO1xufTtcblxuTWVkaWFTZXQucHJvdG90eXBlLmdldFNlZ21lbnRMaXN0QnlCYW5kd2lkdGggPSBmdW5jdGlvbiBnZXRTZWdtZW50TGlzdEJ5QmFuZHdpZHRoKGJhbmR3aWR0aCkge1xuICAgIHZhciByZXByZXNlbnRhdGlvbnMgPSB0aGlzLl9fYWRhcHRhdGlvblNldC5nZXRSZXByZXNlbnRhdGlvbnMoKSxcbiAgICAgICAgcmVwcmVzZW50YXRpb25XaXRoQmFuZHdpZHRoTWF0Y2ggPSBmaW5kRWxlbWVudEluQXJyYXkocmVwcmVzZW50YXRpb25zLCBmdW5jdGlvbihyZXByZXNlbnRhdGlvbikge1xuICAgICAgICAgICAgdmFyIHJlcHJlc2VudGF0aW9uQmFuZHdpZHRoID0gcmVwcmVzZW50YXRpb24uZ2V0QmFuZHdpZHRoKCk7XG4gICAgICAgICAgICByZXR1cm4gKE51bWJlcihyZXByZXNlbnRhdGlvbkJhbmR3aWR0aCkgPT09IE51bWJlcihiYW5kd2lkdGgpKTtcbiAgICAgICAgfSksXG4gICAgICAgIHNlZ21lbnRMaXN0ID0gZ2V0U2VnbWVudExpc3RGb3JSZXByZXNlbnRhdGlvbihyZXByZXNlbnRhdGlvbldpdGhCYW5kd2lkdGhNYXRjaCk7XG4gICAgcmV0dXJuIHNlZ21lbnRMaXN0O1xufTtcblxuTWVkaWFTZXQucHJvdG90eXBlLmdldEF2YWlsYWJsZUJhbmR3aWR0aHMgPSBmdW5jdGlvbiBnZXRBdmFpbGFibGVCYW5kd2lkdGhzKCkge1xuICAgIHJldHVybiB0aGlzLl9fYWRhcHRhdGlvblNldC5nZXRSZXByZXNlbnRhdGlvbnMoKS5tYXAoXG4gICAgICAgIGZ1bmN0aW9uKHJlcHJlc2VudGF0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gTnVtYmVyKHJlcHJlc2VudGF0aW9uLmdldEJhbmR3aWR0aCgpKTtcbiAgICAgICAgfSkuZmlsdGVyKFxuICAgICAgICBmdW5jdGlvbihiYW5kd2lkdGgpIHtcbiAgICAgICAgICAgIHJldHVybiBleGlzdHkoYmFuZHdpZHRoKTtcbiAgICAgICAgfVxuICAgICk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1lZGlhU2V0OyIsIid1c2Ugc3RyaWN0JztcblxudmFyIGV4aXN0eSA9IHJlcXVpcmUoJy4vdXRpbC9leGlzdHkuanMnKSxcbiAgICBpc051bWJlciA9IHJlcXVpcmUoJy4vdXRpbC9pc051bWJlci5qcycpLFxuICAgIGV4dGVuZE9iamVjdCA9IHJlcXVpcmUoJy4vdXRpbC9leHRlbmRPYmplY3QuanMnKSxcbiAgICBFdmVudERpc3BhdGNoZXJNaXhpbiA9IHJlcXVpcmUoJy4vZXZlbnRzL0V2ZW50RGlzcGF0Y2hlck1peGluLmpzJyksXG4gICAgbG9hZFNlZ21lbnQgPSByZXF1aXJlKCcuL3NlZ21lbnRzL2xvYWRTZWdtZW50LmpzJyksXG4gICAgLy8gVE9ETzogRGV0ZXJtaW5lIGFwcHJvcHJpYXRlIGRlZmF1bHQgc2l6ZSAob3IgYmFzZSBvbiBzZWdtZW50IG4geCBzaXplL2R1cmF0aW9uPylcbiAgICAvLyBNdXN0IGNvbnNpZGVyIEFCUiBTd2l0Y2hpbmcgJiBWaWV3aW5nIGV4cGVyaWVuY2Ugb2YgYWxyZWFkeS1idWZmZXJlZCBzZWdtZW50cy5cbiAgICBNSU5fREVTSVJFRF9CVUZGRVJfU0laRSA9IDIwLFxuICAgIE1BWF9ERVNJUkVEX0JVRkZFUl9TSVpFID0gNDAsXG4gICAgREVGQVVMVF9SRVRSWV9DT1VOVCA9IDMsXG4gICAgREVGQVVMVF9SRVRSWV9JTlRFUlZBTCA9IDI1MDtcblxuZnVuY3Rpb24gd2FpdFRpbWVUb1JlY2hlY2tTdGF0aWMoY3VycmVudFRpbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJlZFRpbWVSYW5nZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWdtZW50RHVyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0RG93bmxvYWRSb3VuZFRyaXBUaW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluRGVzaXJlZEJ1ZmZlclNpemUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhEZXNpcmVkQnVmZmVyU2l6ZSkge1xuICAgIHZhciBjdXJyZW50UmFuZ2UgPSBmaW5kVGltZVJhbmdlRWRnZShjdXJyZW50VGltZSwgYnVmZmVyZWRUaW1lUmFuZ2VzKSxcbiAgICAgICAgYnVmZmVyU2l6ZTtcblxuICAgIGlmICghZXhpc3R5KGN1cnJlbnRSYW5nZSkpIHsgcmV0dXJuIDA7IH1cblxuICAgIGJ1ZmZlclNpemUgPSBjdXJyZW50UmFuZ2UuZ2V0RW5kKCkgLSBjdXJyZW50VGltZTtcblxuICAgIGlmIChidWZmZXJTaXplIDwgbWluRGVzaXJlZEJ1ZmZlclNpemUpIHsgcmV0dXJuIDA7IH1cbiAgICBlbHNlIGlmIChidWZmZXJTaXplIDwgbWF4RGVzaXJlZEJ1ZmZlclNpemUpIHsgcmV0dXJuIChzZWdtZW50RHVyYXRpb24gLSBsYXN0RG93bmxvYWRSb3VuZFRyaXBUaW1lKSAqIDEwMDA7IH1cblxuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgubWluKHNlZ21lbnREdXJhdGlvbiwgMikgKiAxMDAwKTtcbn1cblxuZnVuY3Rpb24gd2FpdFRpbWVUb1JlY2hlY2tMaXZlKGN1cnJlbnRUaW1lLCBidWZmZXJlZFRpbWVSYW5nZXMsIHNlZ21lbnRMaXN0KSB7XG4gICAgdmFyIGN1cnJlbnRSYW5nZSA9IGZpbmRUaW1lUmFuZ2VFZGdlKGN1cnJlbnRUaW1lLCBidWZmZXJlZFRpbWVSYW5nZXMpLFxuICAgICAgICBuZXh0U2VnbWVudCxcbiAgICAgICAgc2FmZUxpdmVFZGdlLFxuICAgICAgICB0aW1lUGFzdFNhZmVMaXZlRWRnZTtcblxuICAgIGlmICghZXhpc3R5KGN1cnJlbnRSYW5nZSkpIHsgcmV0dXJuIDA7IH1cblxuICAgIG5leHRTZWdtZW50ID0gc2VnbWVudExpc3QuZ2V0U2VnbWVudEJ5VGltZShjdXJyZW50UmFuZ2UuZ2V0RW5kKCkpO1xuICAgIHNhZmVMaXZlRWRnZSA9IChEYXRlLm5vdygpIC0gKHNlZ21lbnRMaXN0LmdldFNlZ21lbnREdXJhdGlvbigpICogMTAwMCkpO1xuICAgIHRpbWVQYXN0U2FmZUxpdmVFZGdlID0gbmV4dFNlZ21lbnQuZ2V0VVRDV2FsbENsb2NrU3RhcnRUaW1lKCkgLSBzYWZlTGl2ZUVkZ2U7XG5cbiAgICBpZiAodGltZVBhc3RTYWZlTGl2ZUVkZ2UgPCAwLjAwMykgeyByZXR1cm4gMDsgfVxuXG4gICAgcmV0dXJuIHRpbWVQYXN0U2FmZUxpdmVFZGdlO1xufVxuXG5mdW5jdGlvbiBuZXh0U2VnbWVudFRvTG9hZChjdXJyZW50VGltZSwgYnVmZmVyZWRUaW1lUmFuZ2VzLCBzZWdtZW50TGlzdCkge1xuICAgIHZhciBjdXJyZW50UmFuZ2UgPSBmaW5kVGltZVJhbmdlRWRnZShjdXJyZW50VGltZSwgYnVmZmVyZWRUaW1lUmFuZ2VzKSxcbiAgICAgICAgc2VnbWVudFRvTG9hZDtcblxuICAgIGlmIChleGlzdHkoY3VycmVudFJhbmdlKSkge1xuICAgICAgICBzZWdtZW50VG9Mb2FkID0gc2VnbWVudExpc3QuZ2V0U2VnbWVudEJ5VGltZShjdXJyZW50UmFuZ2UuZ2V0RW5kKCkpO1xuICAgIH0gZWxzZSBpZiAoc2VnbWVudExpc3QuZ2V0SXNMaXZlKCkpIHtcbiAgICAgICAgc2VnbWVudFRvTG9hZCA9IHNlZ21lbnRMaXN0LmdldFNlZ21lbnRCeVVUQ1dhbGxDbG9ja1RpbWUoRGF0ZS5ub3coKSAtIChzZWdtZW50TGlzdC5nZXRTZWdtZW50RHVyYXRpb24oKSAqIDEwMDApKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBPdGhlcndpc2UgKGkuZS4gaWYgVk9EL3N0YXRpYyBzdHJlYW1zLCBnZXQgdGhlIHNlZ21lbnQgQCBjdXJyZW50VGltZSkuXG4gICAgICAgIHNlZ21lbnRUb0xvYWQgPSBzZWdtZW50TGlzdC5nZXRTZWdtZW50QnlUaW1lKGN1cnJlbnRUaW1lKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2VnbWVudFRvTG9hZDtcbn1cblxuZnVuY3Rpb24gZmluZFRpbWVSYW5nZUVkZ2UoY3VycmVudFRpbWUsIGJ1ZmZlcmVkVGltZVJhbmdlcykge1xuICAgIHZhciBjdXJyZW50UmFuZ2UgPSBidWZmZXJlZFRpbWVSYW5nZXMuZ2V0VGltZVJhbmdlQnlUaW1lKGN1cnJlbnRUaW1lKSxcbiAgICAgICAgaSxcbiAgICAgICAgbGVuZ3RoLFxuICAgICAgICB0aW1lUmFuZ2VUb0NoZWNrO1xuXG4gICAgaWYgKCFleGlzdHkoY3VycmVudFJhbmdlKSkgeyByZXR1cm4gY3VycmVudFJhbmdlOyB9XG5cbiAgICBpID0gY3VycmVudFJhbmdlLmdldEluZGV4KCkgKyAxO1xuICAgIGxlbmd0aCA9IGJ1ZmZlcmVkVGltZVJhbmdlcy5nZXRMZW5ndGgoKTtcblxuICAgIGZvciAoO2k8bGVuZ3RoO2krKykge1xuICAgICAgICB0aW1lUmFuZ2VUb0NoZWNrID0gYnVmZmVyZWRUaW1lUmFuZ2VzLmdldFRpbWVSYW5nZUJ5SW5kZXgoaSk7XG4gICAgICAgIGlmKCh0aW1lUmFuZ2VUb0NoZWNrLmdldFN0YXJ0KCkgLSBjdXJyZW50UmFuZ2UuZ2V0RW5kKCkpID4gMC4wMDMpIHsgYnJlYWs7IH1cbiAgICAgICAgY3VycmVudFJhbmdlID0gdGltZVJhbmdlVG9DaGVjaztcbiAgICB9XG5cbiAgICByZXR1cm4gY3VycmVudFJhbmdlO1xufVxuXG4vKipcbiAqXG4gKiBNZWRpYVR5cGVMb2FkZXIgY29vcmRpbmF0ZXMgYmV0d2VlbiBzZWdtZW50IGRvd25sb2FkaW5nIGFuZCBhZGRpbmcgc2VnbWVudHMgdG8gdGhlIE1TRSBzb3VyY2UgYnVmZmVyIGZvciBhIGdpdmVuIG1lZGlhIHR5cGUgKGUuZy4gJ2F1ZGlvJyBvciAndmlkZW8nKS5cbiAqXG4gKiBAcGFyYW0gc291cmNlQnVmZmVyRGF0YVF1ZXVlIHtTb3VyY2VCdWZmZXJEYXRhUXVldWV9IG9iamVjdCBpbnN0YW5jZSB0aGF0IGhhbmRsZXMgYWRkaW5nIHNlZ21lbnRzIHRvIE1TRSBTb3VyY2VCdWZmZXJcbiAqIEBwYXJhbSBtZWRpYVR5cGUge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgbWVkaWEgdHlwZSAoZS5nLiAnYXVkaW8nIG9yICd2aWRlbycpIGZvciB0aGUgbWVkaWEgc2V0XG4gKiBAcGFyYW0gdGVjaCB7b2JqZWN0fSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZGVvLmpzIEh0bWw1IHRlY2ggaW5zdGFuY2UuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTWVkaWFUeXBlTG9hZGVyKG1hbmlmZXN0Q29udHJvbGxlciwgbWVkaWFUeXBlLCBzb3VyY2VCdWZmZXJEYXRhUXVldWUsIHRlY2gpIHtcbiAgICBpZiAoIWV4aXN0eShtYW5pZmVzdENvbnRyb2xsZXIpKSB7IHRocm93IG5ldyBFcnJvcignTWVkaWFUeXBlTG9hZGVyIG11c3QgYmUgaW5pdGlhbGl6ZWQgd2l0aCBhIG1hbmlmZXN0Q29udHJvbGxlciEnKTsgfVxuICAgIGlmICghZXhpc3R5KG1lZGlhVHlwZSkpIHsgdGhyb3cgbmV3IEVycm9yKCdNZWRpYVR5cGVMb2FkZXIgbXVzdCBiZSBpbml0aWFsaXplZCB3aXRoIGEgbWVkaWFUeXBlIScpOyB9XG4gICAgLy8gTk9URTogUmF0aGVyIHRoYW4gcGFzc2luZyBpbiBhIHJlZmVyZW5jZSB0byB0aGUgTWVkaWFTZXQgaW5zdGFuY2UgZm9yIGEgbWVkaWEgdHlwZSwgd2UgcGFzcyBpbiBhIHJlZmVyZW5jZSB0byB0aGVcbiAgICAvLyBjb250cm9sbGVyICYgdGhlIG1lZGlhVHlwZSBzbyB0aGF0IHRoZSBNZWRpYVR5cGVMb2FkZXIgZG9lc24ndCBuZWVkIHRvIGJlIGF3YXJlIG9mIHN0YXRlIGNoYW5nZXMvdXBkYXRlcyB0b1xuICAgIC8vIHRoZSBtYW5pZmVzdCBkYXRhIChzYXksIGlmIHRoZSBwbGF5bGlzdCBpcyBkeW5hbWljLydsaXZlJykuXG4gICAgdGhpcy5fX21hbmlmZXN0Q29udHJvbGxlciA9IG1hbmlmZXN0Q29udHJvbGxlcjtcbiAgICB0aGlzLl9fbWVkaWFUeXBlID0gbWVkaWFUeXBlO1xuICAgIHRoaXMuX19zb3VyY2VCdWZmZXJEYXRhUXVldWUgPSBzb3VyY2VCdWZmZXJEYXRhUXVldWU7XG4gICAgdGhpcy5fX3RlY2ggPSB0ZWNoO1xuICAgIC8vIEN1cnJlbnRseSwgc2V0IHRoZSBkZWZhdWx0IGJhbmR3aWR0aCB0byB0aGUgMHRoIGluZGV4IG9mIHRoZSBhdmFpbGFibGUgYmFuZHdpZHRocy4gQ2FuIGNoYW5nZWQgdG8gd2hhdGV2ZXIgc2VlbXNcbiAgICAvLyBhcHByb3ByaWF0ZSAoQ0pQKS5cbiAgICB0aGlzLnNldEN1cnJlbnRCYW5kd2lkdGgodGhpcy5nZXRBdmFpbGFibGVCYW5kd2lkdGhzKClbMF0pO1xufVxuXG4vKipcbiAqIEVudW1lcmF0aW9uIG9mIGV2ZW50cyBpbnN0YW5jZXMgb2YgdGhpcyBvYmplY3Qgd2lsbCBkaXNwYXRjaC5cbiAqL1xuTWVkaWFUeXBlTG9hZGVyLnByb3RvdHlwZS5ldmVudExpc3QgPSB7XG4gICAgUkVDSEVDS19TRUdNRU5UX0xPQURJTkc6ICdyZWNoZWNrU2VnbWVudExvYWRpbmcnLFxuICAgIFJFQ0hFQ0tfQ1VSUkVOVF9TRUdNRU5UX0xJU1Q6ICdyZWNoZWNrQ3VycmVudFNlZ21lbnRMaXN0JyxcbiAgICBET1dOTE9BRF9EQVRBX1VQREFURTogJ2Rvd25sb2FkRGF0YVVwZGF0ZSdcbn07XG5cbk1lZGlhVHlwZUxvYWRlci5wcm90b3R5cGUuZ2V0TWVkaWFUeXBlID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLl9fbWVkaWFUeXBlOyB9O1xuXG5NZWRpYVR5cGVMb2FkZXIucHJvdG90eXBlLmdldE1lZGlhU2V0ID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLl9fbWFuaWZlc3RDb250cm9sbGVyLmdldE1lZGlhU2V0QnlUeXBlKHRoaXMuX19tZWRpYVR5cGUpOyB9O1xuXG5NZWRpYVR5cGVMb2FkZXIucHJvdG90eXBlLmdldFNvdXJjZUJ1ZmZlckRhdGFRdWV1ZSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5fX3NvdXJjZUJ1ZmZlckRhdGFRdWV1ZTsgfTtcblxuTWVkaWFUeXBlTG9hZGVyLnByb3RvdHlwZS5nZXRDdXJyZW50U2VnbWVudExpc3QgPSBmdW5jdGlvbiBnZXRDdXJyZW50U2VnbWVudExpc3QoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0TWVkaWFTZXQoKS5nZXRTZWdtZW50TGlzdEJ5QmFuZHdpZHRoKHRoaXMuZ2V0Q3VycmVudEJhbmR3aWR0aCgpKTtcbn07XG5cbk1lZGlhVHlwZUxvYWRlci5wcm90b3R5cGUuZ2V0Q3VycmVudEJhbmR3aWR0aCA9IGZ1bmN0aW9uIGdldEN1cnJlbnRCYW5kd2lkdGgoKSB7IHJldHVybiB0aGlzLl9fY3VycmVudEJhbmR3aWR0aDsgfTtcblxuLyoqXG4gKiBTZXRzIHRoZSBjdXJyZW50IGJhbmR3aWR0aCwgd2hpY2ggY29ycmVzcG9uZHMgdG8gdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBzZWdtZW50IGxpc3QgKGkuZS4gdGhlIHNlZ21lbnQgbGlzdCBpbiB0aGVcbiAqIG1lZGlhIHNldCBmcm9tIHdoaWNoIHdlIHNob3VsZCBiZSBkb3dubG9hZGluZyBzZWdtZW50cykuXG4gKiBAcGFyYW0gYmFuZHdpZHRoIHtudW1iZXJ9XG4gKi9cbk1lZGlhVHlwZUxvYWRlci5wcm90b3R5cGUuc2V0Q3VycmVudEJhbmR3aWR0aCA9IGZ1bmN0aW9uIHNldEN1cnJlbnRCYW5kd2lkdGgoYmFuZHdpZHRoKSB7XG4gICAgaWYgKCFpc051bWJlcihiYW5kd2lkdGgpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTWVkaWFUeXBlTG9hZGVyOjpzZXRDdXJyZW50QmFuZHdpZHRoKCkgZXhwZWN0cyBhIG51bWVyaWMgdmFsdWUgZm9yIGJhbmR3aWR0aCEnKTtcbiAgICB9XG4gICAgdmFyIGF2YWlsYWJsZUJhbmR3aWR0aHMgPSB0aGlzLmdldEF2YWlsYWJsZUJhbmR3aWR0aHMoKTtcbiAgICBpZiAoYXZhaWxhYmxlQmFuZHdpZHRocy5pbmRleE9mKGJhbmR3aWR0aCkgPCAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTWVkaWFUeXBlTG9hZGVyOjpzZXRDdXJyZW50QmFuZHdpZHRoKCkgbXVzdCBiZSBzZXQgdG8gb25lIG9mIHRoZSBmb2xsb3dpbmcgdmFsdWVzOiAnICsgYXZhaWxhYmxlQmFuZHdpZHRocy5qb2luKCcsICcpKTtcbiAgICB9XG4gICAgaWYgKGJhbmR3aWR0aCA9PT0gdGhpcy5fX2N1cnJlbnRCYW5kd2lkdGgpIHsgcmV0dXJuOyB9XG4gICAgLy8gVHJhY2sgd2hlbiB3ZSd2ZSBzd2l0Y2ggYmFuZHdpZHRocywgc2luY2Ugd2UnbGwgbmVlZCB0byAocmUpbG9hZCB0aGUgaW5pdGlhbGl6YXRpb24gc2VnbWVudCBmb3IgdGhlIHNlZ21lbnQgbGlzdFxuICAgIC8vIHdoZW5ldmVyIHdlIHN3aXRjaCBiZXR3ZWVuIHNlZ21lbnQgbGlzdHMuIFRoaXMgYWxsb3dzIE1lZGlhVHlwZUxvYWRlciBpbnN0YW5jZXMgdG8gYXV0b21hdGljYWxseSBkbyB0aGlzLCBoaWRpbmcgdGhvc2VcbiAgICAvLyBkZXRhaWxzIGZyb20gdGhlIG91dHNpZGUuXG4gICAgdGhpcy5fX2N1cnJlbnRCYW5kd2lkdGhDaGFuZ2VkID0gdHJ1ZTtcbiAgICB0aGlzLl9fY3VycmVudEJhbmR3aWR0aCA9IGJhbmR3aWR0aDtcbn07XG5cbk1lZGlhVHlwZUxvYWRlci5wcm90b3R5cGUuZ2V0QXZhaWxhYmxlQmFuZHdpZHRocyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5nZXRNZWRpYVNldCgpLmdldEF2YWlsYWJsZUJhbmR3aWR0aHMoKTsgfTtcblxuTWVkaWFUeXBlTG9hZGVyLnByb3RvdHlwZS5nZXRMYXN0RG93bmxvYWRSb3VuZFRyaXBUaW1lU3BhbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5fX2xhc3REb3dubG9hZFJvdW5kVHJpcFRpbWVTcGFuIHx8IDA7IH07XG5cbi8qKlxuICogS2lja3Mgb2ZmIHNlZ21lbnQgbG9hZGluZyBmb3IgdGhlIG1lZGlhIHNldFxuICovXG5NZWRpYVR5cGVMb2FkZXIucHJvdG90eXBlLnN0YXJ0TG9hZGluZ1NlZ21lbnRzID0gZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgIG5vd1VUQztcblxuICAgIC8vIEV2ZW50IGxpc3RlbmVyIGZvciByZWNoZWNraW5nIHNlZ21lbnQgbG9hZGluZy4gVGhpcyBldmVudCBpcyBmaXJlZCB3aGVuZXZlciBhIHNlZ21lbnQgaGFzIGJlZW4gc3VjY2Vzc2Z1bGx5XG4gICAgLy8gZG93bmxvYWRlZCBhbmQgYWRkZWQgdG8gdGhlIGJ1ZmZlciBvciwgaWYgbm90IGN1cnJlbnRseSBsb2FkaW5nIHNlZ21lbnRzIChiZWNhdXNlIHRoZSBidWZmZXIgaXMgc3VmZmljaWVudGx5IGZ1bGxcbiAgICAvLyByZWxhdGl2ZSB0byB0aGUgY3VycmVudCBwbGF5YmFjayB0aW1lKSwgd2hlbmV2ZXIgc29tZSBhbW91bnQgb2YgdGltZSBoYXMgZWxhcHNlZCBhbmQgd2Ugc2hvdWxkIGNoZWNrIG9uIHRoZSBidWZmZXJcbiAgICAvLyBzdGF0ZSBhZ2Fpbi5cbiAgICAvLyBOT1RFOiBTdG9yZSBhIHJlZmVyZW5jZSB0byB0aGUgZXZlbnQgaGFuZGxlciB0byBwb3RlbnRpYWxseSByZW1vdmUgaXQgbGF0ZXIuXG4gICAgdGhpcy5fX3JlY2hlY2tTZWdtZW50TG9hZGluZ0hhbmRsZXIgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBzZWxmLnRyaWdnZXIoeyB0eXBlOnNlbGYuZXZlbnRMaXN0LlJFQ0hFQ0tfQ1VSUkVOVF9TRUdNRU5UX0xJU1QsIHRhcmdldDpzZWxmIH0pO1xuICAgICAgICBzZWxmLl9fY2hlY2tTZWdtZW50TG9hZGluZyhzZWxmLl9fdGVjaC5jdXJyZW50VGltZSgpLCBNSU5fREVTSVJFRF9CVUZGRVJfU0laRSwgTUFYX0RFU0lSRURfQlVGRkVSX1NJWkUpO1xuICAgIH07XG5cbiAgICB0aGlzLm9uKHRoaXMuZXZlbnRMaXN0LlJFQ0hFQ0tfU0VHTUVOVF9MT0FESU5HLCB0aGlzLl9fcmVjaGVja1NlZ21lbnRMb2FkaW5nSGFuZGxlcik7XG4gICAgdGhpcy5fX3RlY2gub24oJ3NlZWtpbmcnLCB0aGlzLl9fcmVjaGVja1NlZ21lbnRMb2FkaW5nSGFuZGxlcik7XG5cbiAgICBpZiAodGhpcy5nZXRDdXJyZW50U2VnbWVudExpc3QoKS5nZXRJc0xpdmUoKSkge1xuICAgICAgICBub3dVVEMgPSBEYXRlLm5vdygpO1xuICAgICAgICB0aGlzLm9uZSh0aGlzLmV2ZW50TGlzdC5SRUNIRUNLX1NFR01FTlRfTE9BRElORywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIHZhciBzZWcgPSBzZWxmLmdldEN1cnJlbnRTZWdtZW50TGlzdCgpLmdldFNlZ21lbnRCeVVUQ1dhbGxDbG9ja1RpbWUobm93VVRDKSxcbiAgICAgICAgICAgICAgICBzZWdVVENTdGFydFRpbWUgPSBzZWcuZ2V0VVRDV2FsbENsb2NrU3RhcnRUaW1lKCksXG4gICAgICAgICAgICAgICAgdGltZU9mZnNldCA9IChub3dVVEMgLSBzZWdVVENTdGFydFRpbWUpLzEwMDAsXG4gICAgICAgICAgICAgICAgc2Vla1RvVGltZSA9IHNlbGYuX19zb3VyY2VCdWZmZXJEYXRhUXVldWUuZ2V0QnVmZmVyZWRUaW1lUmFuZ2VMaXN0QWxpZ25lZFRvU2VnbWVudER1cmF0aW9uKHNlZy5nZXREdXJhdGlvbigpKS5nZXRUaW1lUmFuZ2VCeUluZGV4KDApLmdldFN0YXJ0KCkgKyB0aW1lT2Zmc2V0O1xuICAgICAgICAgICAgc2VsZi5fX3RlY2guc2V0Q3VycmVudFRpbWUoc2Vla1RvVGltZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIE1hbnVhbGx5IGNoZWNrIG9uIGxvYWRpbmcgc2VnbWVudHMgdGhlIGZpcnN0IHRpbWUgYXJvdW5kLlxuICAgIHRoaXMuX19jaGVja1NlZ21lbnRMb2FkaW5nKHRoaXMuX190ZWNoLmN1cnJlbnRUaW1lKCksIE1JTl9ERVNJUkVEX0JVRkZFUl9TSVpFLCBNQVhfREVTSVJFRF9CVUZGRVJfU0laRSk7XG59O1xuXG5NZWRpYVR5cGVMb2FkZXIucHJvdG90eXBlLnN0b3BMb2FkaW5nU2VnbWVudHMgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIWV4aXN0eSh0aGlzLl9fcmVjaGVja1NlZ21lbnRMb2FkaW5nSGFuZGxlcikpIHsgcmV0dXJuOyB9XG5cbiAgICB0aGlzLm9mZih0aGlzLmV2ZW50TGlzdC5SRUNIRUNLX1NFR01FTlRfTE9BRElORywgdGhpcy5fX3JlY2hlY2tTZWdtZW50TG9hZGluZ0hhbmRsZXIpO1xuICAgIHRoaXMuX190ZWNoLm9mZignc2Vla2luZycsIHRoaXMuX19yZWNoZWNrU2VnbWVudExvYWRpbmdIYW5kbGVyKTtcbiAgICB0aGlzLl9fcmVjaGVja1NlZ21lbnRMb2FkaW5nSGFuZGxlciA9IHVuZGVmaW5lZDtcbiAgICBpZiAoZXhpc3R5KHRoaXMuX193YWl0VGltZXJJZCkpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX193YWl0VGltZXJJZCk7XG4gICAgICAgIHRoaXMuX193YWl0VGltZXJJZCA9IHVuZGVmaW5lZDtcbiAgICB9XG59O1xuXG5NZWRpYVR5cGVMb2FkZXIucHJvdG90eXBlLl9fY2hlY2tTZWdtZW50TG9hZGluZyA9IGZ1bmN0aW9uKGN1cnJlbnRUaW1lLCBtaW5EZXNpcmVkQnVmZmVyU2l6ZSwgbWF4RGVzaXJlZEJ1ZmZlclNpemUpIHtcbiAgICB2YXIgbGFzdERvd25sb2FkUm91bmRUcmlwVGltZSA9IHRoaXMuZ2V0TGFzdERvd25sb2FkUm91bmRUcmlwVGltZVNwYW4oKSxcbiAgICAgICAgbG9hZEluaXRpYWxpemF0aW9uID0gdGhpcy5fX2N1cnJlbnRCYW5kd2lkdGhDaGFuZ2VkLFxuICAgICAgICBzZWdtZW50TGlzdCA9IHRoaXMuZ2V0Q3VycmVudFNlZ21lbnRMaXN0KCksXG4gICAgICAgIHNlZ21lbnREdXJhdGlvbiA9IHNlZ21lbnRMaXN0LmdldFNlZ21lbnREdXJhdGlvbigpLFxuICAgICAgICBidWZmZXJlZFRpbWVSYW5nZXMgPSB0aGlzLl9fc291cmNlQnVmZmVyRGF0YVF1ZXVlLmdldEJ1ZmZlcmVkVGltZVJhbmdlTGlzdEFsaWduZWRUb1NlZ21lbnREdXJhdGlvbihzZWdtZW50RHVyYXRpb24pLFxuICAgICAgICBpc0xpdmUgPSBzZWdtZW50TGlzdC5nZXRJc0xpdmUoKSxcbiAgICAgICAgd2FpdFRpbWUsXG4gICAgICAgIHNlZ21lbnRUb0Rvd25sb2FkLFxuICAgICAgICBzZWxmID0gdGhpcztcblxuICAgIC8vIElmIHdlJ3JlIGhlcmUgYnV0IHRoZXJlJ3MgYSB3YWl0VGltZXJJZCwgd2Ugc2hvdWxkIGNsZWFyIGl0IG91dCBzbyB3ZSBkb24ndCBkb1xuICAgIC8vIGFuIGFkZGl0aW9uYWwgcmVjaGVjayB1bm5lY2Vzc2FyaWx5LlxuICAgIGlmIChleGlzdHkodGhpcy5fX3dhaXRUaW1lcklkKSkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fX3dhaXRUaW1lcklkKTtcbiAgICAgICAgdGhpcy5fX3dhaXRUaW1lcklkID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHdhaXRGdW5jdGlvbigpIHtcbiAgICAgICAgc2VsZi5fX2NoZWNrU2VnbWVudExvYWRpbmcoc2VsZi5fX3RlY2guY3VycmVudFRpbWUoKSwgbWluRGVzaXJlZEJ1ZmZlclNpemUsIG1heERlc2lyZWRCdWZmZXJTaXplKTtcbiAgICAgICAgc2VsZi5fX3dhaXRUaW1lcklkID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGlmIChpc0xpdmUpIHtcbiAgICAgICAgd2FpdFRpbWUgPSB3YWl0VGltZVRvUmVjaGVja0xpdmUoY3VycmVudFRpbWUsIGJ1ZmZlcmVkVGltZVJhbmdlcywgc2VnbWVudExpc3QpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHdhaXRUaW1lID0gd2FpdFRpbWVUb1JlY2hlY2tTdGF0aWMoY3VycmVudFRpbWUsIGJ1ZmZlcmVkVGltZVJhbmdlcywgc2VnbWVudER1cmF0aW9uLCBsYXN0RG93bmxvYWRSb3VuZFRyaXBUaW1lLCBtaW5EZXNpcmVkQnVmZmVyU2l6ZSwgbWF4RGVzaXJlZEJ1ZmZlclNpemUpO1xuICAgIH1cblxuICAgIGlmICh3YWl0VGltZSA+IDUwKSB7XG4gICAgICAgIC8vIElmIHdhaXQgdGltZSB3YXMgPiA1MG1zLCByZS1jaGVjayBpbiB3YWl0VGltZSBtcy5cbiAgICAgICAgdGhpcy5fX3dhaXRUaW1lcklkID0gc2V0VGltZW91dCh3YWl0RnVuY3Rpb24sIHdhaXRUaW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBPdGhlcndpc2UsIHN0YXJ0IGxvYWRpbmcgbm93LlxuICAgICAgICBzZWdtZW50VG9Eb3dubG9hZCA9IG5leHRTZWdtZW50VG9Mb2FkKGN1cnJlbnRUaW1lLCBidWZmZXJlZFRpbWVSYW5nZXMsIHNlZ21lbnRMaXN0KTtcbiAgICAgICAgaWYgKGV4aXN0eShzZWdtZW50VG9Eb3dubG9hZCkpIHtcbiAgICAgICAgICAgIC8vIElmIHdlJ3JlIGhlcmUgYnV0IHRoZXJlJ3MgYSBzZWdtZW50TG9hZFhociByZXF1ZXN0LCB3ZSd2ZSBraWNrZWQgb2ZmIGEgcmVjaGVjayBpbiB0aGUgbWlkZGxlIG9mIGEgc2VnbWVudFxuICAgICAgICAgICAgLy8gZG93bmxvYWQuIEhvd2V2ZXIsIHVubGVzcyB3ZSdyZSBsb2FkaW5nIGEgbmV3IHNlZ21lbnQgKGllIG5vdCB3YWl0aW5nKSwgdGhlcmUncyBubyByZWFzb24gdG8gYWJvcnQgdGhlIGN1cnJlbnRcbiAgICAgICAgICAgIC8vIHJlcXVlc3QsIHNvIG9ubHkgY2FuY2VsIGhlcmUgKENKUCkuXG4gICAgICAgICAgICBpZiAoZXhpc3R5KHRoaXMuX19zZWdtZW50TG9hZFhocikpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9fc2VnbWVudExvYWRYaHIuYWJvcnQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9fc2VnbWVudExvYWRYaHIgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX19sb2FkQW5kQnVmZmVyU2VnbWVudChzZWdtZW50VG9Eb3dubG9hZCwgc2VnbWVudExpc3QsIGxvYWRJbml0aWFsaXphdGlvbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBBcHBhcmVudGx5IG5vIHNlZ21lbnQgdG8gbG9hZCwgc28gZ28gaW50byBhIGhvbGRpbmcgcGF0dGVybi5cbiAgICAgICAgICAgIHRoaXMuX193YWl0VGltZXJJZCA9IHNldFRpbWVvdXQod2FpdEZ1bmN0aW9uLCAyMDAwKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbk1lZGlhVHlwZUxvYWRlci5wcm90b3R5cGUuX19sb2FkQW5kQnVmZmVyU2VnbWVudCA9IGZ1bmN0aW9uIGxvYWRBbmRCdWZmZXJTZWdtZW50KHNlZ21lbnQsIHNlZ21lbnRMaXN0LCBsb2FkSW5pdGlhbGl6YXRpb24pIHtcblxuICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgcmV0cnlDb3VudCA9IERFRkFVTFRfUkVUUllfQ09VTlQsXG4gICAgICAgIHJldHJ5SW50ZXJ2YWwgPSBERUZBVUxUX1JFVFJZX0lOVEVSVkFMLFxuICAgICAgICBzZWdtZW50c1RvQnVmZmVyID0gW10sXG4gICAgICAgIHJlcXVlc3RTdGFydFRpbWVTZWNvbmRzO1xuXG4gICAgZnVuY3Rpb24gc3VjY2Vzc0luaXRpYWxpemF0aW9uKGRhdGEpIHtcbiAgICAgICAgc2VnbWVudHNUb0J1ZmZlci5wdXNoKGRhdGEucmVzcG9uc2UpO1xuICAgICAgICByZXF1ZXN0U3RhcnRUaW1lU2Vjb25kcyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpLzEwMDA7XG4gICAgICAgIHNlbGYuX19jdXJyZW50QmFuZHdpZHRoQ2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICBzZWxmLl9fc2VnbWVudExvYWRYaHIgPSBsb2FkU2VnbWVudChzZWdtZW50LCBzdWNjZXNzLCBmYWlsLCBzZWxmKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdWNjZXNzKGRhdGEpIHtcbiAgICAgICAgdmFyIHNvdXJjZUJ1ZmZlckRhdGFRdWV1ZSA9IHNlbGYuX19zb3VyY2VCdWZmZXJEYXRhUXVldWU7XG5cbiAgICAgICAgc2VsZi5fX2xhc3REb3dubG9hZFJvdW5kVHJpcFRpbWVTcGFuID0gKChuZXcgRGF0ZSgpLmdldFRpbWUoKSkvMTAwMCkgLSByZXF1ZXN0U3RhcnRUaW1lU2Vjb25kcztcbiAgICAgICAgc2VnbWVudHNUb0J1ZmZlci5wdXNoKGRhdGEucmVzcG9uc2UpO1xuICAgICAgICBzZWxmLl9fc2VnbWVudExvYWRYaHIgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgc2VsZi50cmlnZ2VyKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6c2VsZi5ldmVudExpc3QuRE9XTkxPQURfREFUQV9VUERBVEUsXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBzZWxmLFxuICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgcnR0OiBzZWxmLl9fbGFzdERvd25sb2FkUm91bmRUcmlwVGltZVNwYW4sXG4gICAgICAgICAgICAgICAgICAgIHBsYXliYWNrVGltZTogc2VnbWVudC5nZXREdXJhdGlvbigpLFxuICAgICAgICAgICAgICAgICAgICBiYW5kd2lkdGg6IHNlZ21lbnRMaXN0LmdldEJhbmR3aWR0aCgpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICAgIHNvdXJjZUJ1ZmZlckRhdGFRdWV1ZS5vbmUoc291cmNlQnVmZmVyRGF0YVF1ZXVlLmV2ZW50TGlzdC5RVUVVRV9FTVBUWSwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIC8vIE9uY2Ugd2UndmUgY29tcGxldGVkIGRvd25sb2FkaW5nIGFuZCBidWZmZXJpbmcgdGhlIHNlZ21lbnQsIGRpc3BhdGNoIGV2ZW50IHRvIG5vdGlmeSB0aGF0IHdlIHNob3VsZCByZWNoZWNrXG4gICAgICAgICAgICAvLyB3aGV0aGVyIG9yIG5vdCB3ZSBzaG91bGQgbG9hZCBhbm90aGVyIHNlZ21lbnQgYW5kLCBpZiBzbywgd2hpY2guIChTZWU6IF9fY2hlY2tTZWdtZW50TG9hZGluZygpIG1ldGhvZCwgYWJvdmUpXG4gICAgICAgICAgICBzZWxmLnRyaWdnZXIoeyB0eXBlOnNlbGYuZXZlbnRMaXN0LlJFQ0hFQ0tfU0VHTUVOVF9MT0FESU5HLCB0YXJnZXQ6c2VsZiB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc291cmNlQnVmZmVyRGF0YVF1ZXVlLmFkZFRvUXVldWUoc2VnbWVudHNUb0J1ZmZlcik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmFpbChkYXRhKSB7XG4gICAgICAgIGlmICgtLXJldHJ5Q291bnQgPD0gMCkge1xuICAgICAgICAgICAgLy8gTk9URTogQWRkIHRoaXMgaWYgd2Ugd2FudCB0byBrZWVwIHJldHJ5aW5nIChDSlApLlxuICAgICAgICAgICAgLy9zZWxmLnRyaWdnZXIoeyB0eXBlOnNlbGYuZXZlbnRMaXN0LlJFQ0hFQ0tfU0VHTUVOVF9MT0FESU5HLCB0YXJnZXQ6c2VsZiB9KTtcbiAgICAgICAgICAgIC8vIE5PVEU6IEFkZCB0aGlzIGlmIHdlIHdhbnQgdG8gZ2l2ZSB1cCAoQ0pQKS5cbiAgICAgICAgICAgIC8vc2VsZi5zdG9wTG9hZGluZ1NlZ21lbnRzKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coJ0ZhaWxlZCB0byBsb2FkIHNlZ21lbnQgQCAnICsgc2VnbWVudC5nZXRVcmwoKSArICcuIFJlcXVlc3QgU3RhdHVzOiAnICsgZGF0YS5zdGF0dXMpO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmVxdWVzdFN0YXJ0VGltZVNlY29uZHMgPSAobmV3IERhdGUoKS5nZXRUaW1lKCkpLzEwMDA7XG4gICAgICAgICAgICBzZWxmLl9fc2VnbWVudExvYWRYaHIgPSBsb2FkU2VnbWVudChkYXRhLnJlcXVlc3RlZFNlZ21lbnQsIHN1Y2Nlc3MsIGZhaWwsIHNlbGYpO1xuICAgICAgICB9LCByZXRyeUludGVydmFsKTtcbiAgICB9XG5cbiAgICBpZiAobG9hZEluaXRpYWxpemF0aW9uKSB7XG4gICAgICAgIHNlbGYuX19zZWdtZW50TG9hZFhociA9IGxvYWRTZWdtZW50KHNlZ21lbnRMaXN0LmdldEluaXRpYWxpemF0aW9uKCksIHN1Y2Nlc3NJbml0aWFsaXphdGlvbiwgZmFpbCwgc2VsZik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmVxdWVzdFN0YXJ0VGltZVNlY29uZHMgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKS8xMDAwO1xuICAgICAgICBzZWxmLl9fc2VnbWVudExvYWRYaHIgPSBsb2FkU2VnbWVudChzZWdtZW50LCBzdWNjZXNzLCBmYWlsLCBzZWxmKTtcbiAgICB9XG59O1xuXG4vLyBBZGQgZXZlbnQgZGlzcGF0Y2hlciBmdW5jdGlvbmFsaXR5IHRvIHByb3RvdHlwZS5cbmV4dGVuZE9iamVjdChNZWRpYVR5cGVMb2FkZXIucHJvdG90eXBlLCBFdmVudERpc3BhdGNoZXJNaXhpbik7XG5cbm1vZHVsZS5leHBvcnRzID0gTWVkaWFUeXBlTG9hZGVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZXhpc3R5ID0gcmVxdWlyZSgnLi91dGlsL2V4aXN0eS5qcycpLFxuICAgIFNvdXJjZUJ1ZmZlckRhdGFRdWV1ZSA9IHJlcXVpcmUoJy4vU291cmNlQnVmZmVyRGF0YVF1ZXVlLmpzJyksXG4gICAgTWVkaWFUeXBlTG9hZGVyID0gcmVxdWlyZSgnLi9NZWRpYVR5cGVMb2FkZXIuanMnKSxcbiAgICBzZWxlY3RTZWdtZW50TGlzdCA9IHJlcXVpcmUoJy4vc2VsZWN0U2VnbWVudExpc3QuanMnKSxcbiAgICBtZWRpYVR5cGVzID0gcmVxdWlyZSgnLi9tYW5pZmVzdC9NZWRpYVR5cGVzLmpzJyk7XG5cbi8vIFRPRE86IE1pZ3JhdGUgbWV0aG9kcyBiZWxvdyB0byBhIGZhY3RvcnkuXG5mdW5jdGlvbiBjcmVhdGVTb3VyY2VCdWZmZXJEYXRhUXVldWVCeVR5cGUobWFuaWZlc3RDb250cm9sbGVyLCBtZWRpYVNvdXJjZSwgbWVkaWFUeXBlKSB7XG4gICAgdmFyIHNvdXJjZUJ1ZmZlclR5cGUgPSBtYW5pZmVzdENvbnRyb2xsZXIuZ2V0TWVkaWFTZXRCeVR5cGUobWVkaWFUeXBlKS5nZXRTb3VyY2VCdWZmZXJUeXBlKCksXG4gICAgICAgIC8vIFRPRE86IFRyeS9jYXRjaCBibG9jaz9cbiAgICAgICAgc291cmNlQnVmZmVyID0gbWVkaWFTb3VyY2UuYWRkU291cmNlQnVmZmVyKHNvdXJjZUJ1ZmZlclR5cGUpO1xuICAgIHJldHVybiBuZXcgU291cmNlQnVmZmVyRGF0YVF1ZXVlKHNvdXJjZUJ1ZmZlcik7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU1lZGlhVHlwZUxvYWRlckZvclR5cGUobWFuaWZlc3RDb250cm9sbGVyLCBtZWRpYVNvdXJjZSwgbWVkaWFUeXBlLCB0ZWNoKSB7XG4gICAgdmFyIHNvdXJjZUJ1ZmZlckRhdGFRdWV1ZSA9IGNyZWF0ZVNvdXJjZUJ1ZmZlckRhdGFRdWV1ZUJ5VHlwZShtYW5pZmVzdENvbnRyb2xsZXIsIG1lZGlhU291cmNlLCBtZWRpYVR5cGUpO1xuICAgIHJldHVybiBuZXcgTWVkaWFUeXBlTG9hZGVyKG1hbmlmZXN0Q29udHJvbGxlciwgbWVkaWFUeXBlLCBzb3VyY2VCdWZmZXJEYXRhUXVldWUsIHRlY2gpO1xufVxuXG4vKipcbiAqXG4gKiBGYWN0b3J5LXN0eWxlIGZ1bmN0aW9uIGZvciBjcmVhdGluZyBhIHNldCBvZiBNZWRpYVR5cGVMb2FkZXJzIGJhc2VkIG9uIHdoYXQncyBkZWZpbmVkIGluIHRoZSBtYW5pZmVzdCBhbmQgd2hhdCBtZWRpYSB0eXBlcyBhcmUgc3VwcG9ydGVkLlxuICpcbiAqIEBwYXJhbSBtYW5pZmVzdENvbnRyb2xsZXIge01hbmlmZXN0Q29udHJvbGxlcn0gICBjb250cm9sbGVyIHRoYXQgcHJvdmlkZXMgZGF0YSB2aWV3cyBmb3IgdGhlIEFCUiBwbGF5bGlzdCBtYW5pZmVzdCBkYXRhXG4gKiBAcGFyYW0gbWVkaWFTb3VyY2Uge01lZGlhU291cmNlfSAgICAgICAgICAgICAgICAgTVNFIE1lZGlhU291cmNlIGluc3RhbmNlIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGN1cnJlbnQgQUJSIHBsYXlsaXN0XG4gKiBAcGFyYW0gdGVjaCB7b2JqZWN0fSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlkZW8uanMgSHRtbDUgdGVjaCBvYmplY3QgaW5zdGFuY2VcbiAqIEByZXR1cm5zIHtBcnJheS48TWVkaWFUeXBlTG9hZGVyPn0gICAgICAgICAgICAgICBTZXQgb2YgTWVkaWFUeXBlTG9hZGVycyBmb3IgbG9hZGluZyBzZWdtZW50cyBmb3IgYSBnaXZlbiBtZWRpYSB0eXBlIChlLmcuIGF1ZGlvIG9yIHZpZGVvKVxuICovXG5mdW5jdGlvbiBjcmVhdGVNZWRpYVR5cGVMb2FkZXJzKG1hbmlmZXN0Q29udHJvbGxlciwgbWVkaWFTb3VyY2UsIHRlY2gpIHtcbiAgICB2YXIgbWF0Y2hlZFR5cGVzID0gbWVkaWFUeXBlcy5maWx0ZXIoZnVuY3Rpb24obWVkaWFUeXBlKSB7XG4gICAgICAgICAgICB2YXIgZXhpc3RzID0gZXhpc3R5KG1hbmlmZXN0Q29udHJvbGxlci5nZXRNZWRpYVNldEJ5VHlwZShtZWRpYVR5cGUpKTtcbiAgICAgICAgICAgIHJldHVybiBleGlzdHM7IH0pLFxuICAgICAgICBtZWRpYVR5cGVMb2FkZXJzID0gbWF0Y2hlZFR5cGVzLm1hcChmdW5jdGlvbihtZWRpYVR5cGUpIHsgcmV0dXJuIGNyZWF0ZU1lZGlhVHlwZUxvYWRlckZvclR5cGUobWFuaWZlc3RDb250cm9sbGVyLCBtZWRpYVNvdXJjZSwgbWVkaWFUeXBlLCB0ZWNoKTsgfSk7XG4gICAgcmV0dXJuIG1lZGlhVHlwZUxvYWRlcnM7XG59XG5cbi8qKlxuICpcbiAqIFBsYXlsaXN0TG9hZGVyIGhhbmRsZXMgdGhlIHRvcC1sZXZlbCBsb2FkaW5nIGFuZCBwbGF5YmFjayBvZiBzZWdtZW50cyBmb3IgYWxsIG1lZGlhIHR5cGVzIChlLmcuIGJvdGggYXVkaW8gYW5kIHZpZGVvKS5cbiAqIFRoaXMgaW5jbHVkZXMgY2hlY2tpbmcgaWYgaXQgc2hvdWxkIHN3aXRjaCBzZWdtZW50IGxpc3RzLCB1cGRhdGluZy9yZXRyaWV2aW5nIGRhdGEgcmVsZXZhbnQgdG8gdGhlc2UgZGVjaXNpb24gZm9yXG4gKiBlYWNoIG1lZGlhIHR5cGUuIEl0IGFsc28gaW5jbHVkZXMgY2hhbmdpbmcgdGhlIHBsYXliYWNrIHJhdGUgb2YgdGhlIHZpZGVvIGJhc2VkIG9uIGRhdGEgYXZhaWxhYmxlIGluIHRoZSBzb3VyY2UgYnVmZmVyLlxuICpcbiAqIEBwYXJhbSBtYW5pZmVzdENvbnRyb2xsZXIge01hbmlmZXN0Q29udHJvbGxlcn0gICBjb250cm9sbGVyIHRoYXQgcHJvdmlkZXMgZGF0YSB2aWV3cyBmb3IgdGhlIEFCUiBwbGF5bGlzdCBtYW5pZmVzdCBkYXRhXG4gKiBAcGFyYW0gbWVkaWFTb3VyY2Uge01lZGlhU291cmNlfSAgICAgICAgICAgICAgICAgTVNFIE1lZGlhU291cmNlIGluc3RhbmNlIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGN1cnJlbnQgQUJSIHBsYXlsaXN0XG4gKiBAcGFyYW0gdGVjaCB7b2JqZWN0fSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlkZW8uanMgSHRtbDUgdGVjaCBvYmplY3QgaW5zdGFuY2VcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBQbGF5bGlzdExvYWRlcihtYW5pZmVzdENvbnRyb2xsZXIsIG1lZGlhU291cmNlLCB0ZWNoKSB7XG4gICAgdGhpcy5fX3RlY2ggPSB0ZWNoO1xuICAgIHRoaXMuX19tZWRpYVR5cGVMb2FkZXJzID0gY3JlYXRlTWVkaWFUeXBlTG9hZGVycyhtYW5pZmVzdENvbnRyb2xsZXIsIG1lZGlhU291cmNlLCB0ZWNoKTtcblxuICAgIHZhciBpO1xuXG4gICAgZnVuY3Rpb24ga2lja29mZk1lZGlhVHlwZUxvYWRlcihtZWRpYVR5cGVMb2FkZXIpIHtcbiAgICAgICAgLy8gTWVkaWFTZXQtc3BlY2lmaWMgdmFyaWFibGVzXG4gICAgICAgIHZhciBkb3dubG9hZFJhdGVSYXRpbyA9IDEuMCxcbiAgICAgICAgICAgIGN1cnJlbnRTZWdtZW50TGlzdEJhbmR3aWR0aCA9IG1lZGlhVHlwZUxvYWRlci5nZXRDdXJyZW50QmFuZHdpZHRoKCksXG4gICAgICAgICAgICBtZWRpYVR5cGUgPSBtZWRpYVR5cGVMb2FkZXIuZ2V0TWVkaWFUeXBlKCk7XG5cbiAgICAgICAgLy8gTGlzdGVuIGZvciBldmVudCB0ZWxsaW5nIHVzIHRvIHJlY2hlY2sgd2hpY2ggc2VnbWVudCBsaXN0IHRoZSBzZWdtZW50cyBzaG91bGQgYmUgbG9hZGVkIGZyb20uXG4gICAgICAgIG1lZGlhVHlwZUxvYWRlci5vbihtZWRpYVR5cGVMb2FkZXIuZXZlbnRMaXN0LlJFQ0hFQ0tfQ1VSUkVOVF9TRUdNRU5UX0xJU1QsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgbWVkaWFTZXQgPSBtYW5pZmVzdENvbnRyb2xsZXIuZ2V0TWVkaWFTZXRCeVR5cGUobWVkaWFUeXBlKSxcbiAgICAgICAgICAgICAgICBpc0Z1bGxzY3JlZW4gPSB0ZWNoLnBsYXllcigpLmlzRnVsbHNjcmVlbigpLFxuICAgICAgICAgICAgICAgIGRhdGEgPSB7fSxcbiAgICAgICAgICAgICAgICBzZWxlY3RlZFNlZ21lbnRMaXN0O1xuXG4gICAgICAgICAgICBkYXRhLmRvd25sb2FkUmF0ZVJhdGlvID0gZG93bmxvYWRSYXRlUmF0aW87XG4gICAgICAgICAgICBkYXRhLmN1cnJlbnRTZWdtZW50TGlzdEJhbmR3aWR0aCA9IGN1cnJlbnRTZWdtZW50TGlzdEJhbmR3aWR0aDtcblxuICAgICAgICAgICAgLy8gUmF0aGVyIHRoYW4gbW9uaXRvcmluZyBldmVudHMvdXBkYXRpbmcgc3RhdGUsIHNpbXBseSBnZXQgcmVsZXZhbnQgdmlkZW8gdmlld3BvcnQgZGltcyBvbiB0aGUgZmx5IGFzIG5lZWRlZC5cbiAgICAgICAgICAgIGRhdGEud2lkdGggPSBpc0Z1bGxzY3JlZW4gPyB3aW5kb3cuc2NyZWVuLndpZHRoIDogdGVjaC5wbGF5ZXIoKS53aWR0aCgpO1xuICAgICAgICAgICAgZGF0YS5oZWlnaHQgPSBpc0Z1bGxzY3JlZW4gPyB3aW5kb3cuc2NyZWVuLmhlaWdodCA6IHRlY2gucGxheWVyKCkuaGVpZ2h0KCk7XG5cbiAgICAgICAgICAgIHNlbGVjdGVkU2VnbWVudExpc3QgPSBzZWxlY3RTZWdtZW50TGlzdChtZWRpYVNldCwgZGF0YSk7XG5cbiAgICAgICAgICAgIC8vIFRPRE86IFNob3VsZCB3ZSByZWZhY3RvciB0byBzZXQgYmFzZWQgb24gc2VnbWVudExpc3QgaW5zdGVhZD9cbiAgICAgICAgICAgIC8vIChQb3RlbnRpYWxseSkgdXBkYXRlIHdoaWNoIHNlZ21lbnQgbGlzdCB0aGUgc2VnbWVudHMgc2hvdWxkIGJlIGxvYWRlZCBmcm9tIChiYXNlZCBvbiBzZWdtZW50IGxpc3QncyBiYW5kd2lkdGgvYml0cmF0ZSlcbiAgICAgICAgICAgIG1lZGlhVHlwZUxvYWRlci5zZXRDdXJyZW50QmFuZHdpZHRoKHNlbGVjdGVkU2VnbWVudExpc3QuZ2V0QmFuZHdpZHRoKCkpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBVcGRhdGUgdGhlIGRvd25sb2FkIHJhdGUgKHJvdW5kIHRyaXAgdGltZSB0byBkb3dubG9hZCBhIHNlZ21lbnQgb2YgYSBnaXZlbiBhdmVyYWdlIGJhbmR3aWR0aC9iaXRyYXRlKSB0byB1c2VcbiAgICAgICAgLy8gd2l0aCBjaG9vc2luZyB3aGljaCBzdHJlYW0gdmFyaWFudCB0byBsb2FkIHNlZ21lbnRzIGZyb20uXG4gICAgICAgIG1lZGlhVHlwZUxvYWRlci5vbihtZWRpYVR5cGVMb2FkZXIuZXZlbnRMaXN0LkRPV05MT0FEX0RBVEFfVVBEQVRFLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgZG93bmxvYWRSYXRlUmF0aW8gPSBldmVudC5kYXRhLnBsYXliYWNrVGltZSAvIGV2ZW50LmRhdGEucnR0O1xuICAgICAgICAgICAgY3VycmVudFNlZ21lbnRMaXN0QmFuZHdpZHRoID0gZXZlbnQuZGF0YS5iYW5kd2lkdGg7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEtpY2tvZmYgc2VnbWVudCBsb2FkaW5nIGZvciB0aGUgbWVkaWEgdHlwZS5cbiAgICAgICAgbWVkaWFUeXBlTG9hZGVyLnN0YXJ0TG9hZGluZ1NlZ21lbnRzKCk7XG4gICAgfVxuXG4gICAgLy8gRm9yIGVhY2ggb2YgdGhlIG1lZGlhIHR5cGVzIChlLmcuICdhdWRpbycgJiAndmlkZW8nKSBpbiB0aGUgQUJSIG1hbmlmZXN0Li4uXG4gICAgZm9yIChpPTA7IGk8dGhpcy5fX21lZGlhVHlwZUxvYWRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAga2lja29mZk1lZGlhVHlwZUxvYWRlcih0aGlzLl9fbWVkaWFUeXBlTG9hZGVyc1tpXSk7XG4gICAgfVxuXG4gICAgLy8gTk9URTogVGhpcyBjb2RlIGJsb2NrIGhhbmRsZXMgcHNldWRvLSdwYXVzaW5nJy8ndW5wYXVzaW5nJyAoY2hhbmdpbmcgdGhlIHBsYXliYWNrUmF0ZSkgYmFzZWQgb24gd2hldGhlciBvciBub3RcbiAgICAvLyB0aGVyZSBpcyBkYXRhIGF2YWlsYWJsZSBpbiB0aGUgYnVmZmVyLCBidXQgaW5kaXJlY3RseSwgYnkgbGlzdGVuaW5nIHRvIGEgZmV3IGV2ZW50cyBhbmQgdXNpbmcgdGhlIHZpZGVvIGVsZW1lbnQnc1xuICAgIC8vIHJlYWR5IHN0YXRlLlxuICAgIHZhciBjaGFuZ2VQbGF5YmFja1JhdGVFdmVudHMgPSBbJ3NlZWtpbmcnLCAnY2FucGxheScsICdjYW5wbGF5dGhyb3VnaCddLFxuICAgICAgICBldmVudFR5cGU7XG5cbiAgICBmdW5jdGlvbiBjaGFuZ2VQbGF5YmFja1JhdGVFdmVudHNIYW5kbGVyKGV2ZW50KSB7XG4gICAgICAgIHZhciByZWFkeVN0YXRlID0gdGVjaC5lbCgpLnJlYWR5U3RhdGUsXG4gICAgICAgICAgICBwbGF5YmFja1JhdGUgPSAocmVhZHlTdGF0ZSA9PT0gNCkgPyAxIDogMDtcbiAgICAgICAgdGVjaC5zZXRQbGF5YmFja1JhdGUocGxheWJhY2tSYXRlKTtcbiAgICB9XG5cbiAgICBmb3IoaT0wOyBpPGNoYW5nZVBsYXliYWNrUmF0ZUV2ZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBldmVudFR5cGUgPSBjaGFuZ2VQbGF5YmFja1JhdGVFdmVudHNbaV07XG4gICAgICAgIHRlY2gub24oZXZlbnRUeXBlLCBjaGFuZ2VQbGF5YmFja1JhdGVFdmVudHNIYW5kbGVyKTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGxheWxpc3RMb2FkZXI7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJy4vdXRpbC9pc0Z1bmN0aW9uLmpzJyksXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJy4vdXRpbC9pc0FycmF5LmpzJyksXG4gICAgaXNOdW1iZXIgPSByZXF1aXJlKCcuL3V0aWwvaXNOdW1iZXIuanMnKSxcbiAgICBleGlzdHkgPSByZXF1aXJlKCcuL3V0aWwvZXhpc3R5LmpzJyksXG4gICAgZXh0ZW5kT2JqZWN0ID0gcmVxdWlyZSgnLi91dGlsL2V4dGVuZE9iamVjdC5qcycpLFxuICAgIEV2ZW50RGlzcGF0Y2hlck1peGluID0gcmVxdWlyZSgnLi9ldmVudHMvRXZlbnREaXNwYXRjaGVyTWl4aW4uanMnKTtcblxuZnVuY3Rpb24gY3JlYXRlVGltZVJhbmdlT2JqZWN0KHNvdXJjZUJ1ZmZlciwgaW5kZXgsIHRyYW5zZm9ybUZuKSB7XG4gICAgaWYgKCFpc0Z1bmN0aW9uKHRyYW5zZm9ybUZuKSkge1xuICAgICAgICB0cmFuc2Zvcm1GbiA9IGZ1bmN0aW9uKHRpbWUpIHsgcmV0dXJuIHRpbWU7IH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0U3RhcnQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdHJhbnNmb3JtRm4oc291cmNlQnVmZmVyLmJ1ZmZlcmVkLnN0YXJ0KGluZGV4KSk7IH0sXG4gICAgICAgIGdldEVuZDogZnVuY3Rpb24oKSB7IHJldHVybiB0cmFuc2Zvcm1Gbihzb3VyY2VCdWZmZXIuYnVmZmVyZWQuZW5kKGluZGV4KSk7IH0sXG4gICAgICAgIGdldEluZGV4OiBmdW5jdGlvbigpIHsgcmV0dXJuIGluZGV4OyB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlQnVmZmVyZWRUaW1lUmFuZ2VMaXN0KHNvdXJjZUJ1ZmZlciwgdHJhbnNmb3JtRm4pIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBnZXRMZW5ndGg6IGZ1bmN0aW9uKCkgeyByZXR1cm4gc291cmNlQnVmZmVyLmJ1ZmZlcmVkLmxlbmd0aDsgfSxcbiAgICAgICAgZ2V0VGltZVJhbmdlQnlJbmRleDogZnVuY3Rpb24oaW5kZXgpIHsgcmV0dXJuIGNyZWF0ZVRpbWVSYW5nZU9iamVjdChzb3VyY2VCdWZmZXIsIGluZGV4LCB0cmFuc2Zvcm1Gbik7IH0sXG4gICAgICAgIGdldFRpbWVSYW5nZUJ5VGltZTogZnVuY3Rpb24odGltZSwgdG9sZXJhbmNlKSB7XG4gICAgICAgICAgICBpZiAoIWlzTnVtYmVyKHRvbGVyYW5jZSkpIHsgdG9sZXJhbmNlID0gMC4xNTsgfVxuICAgICAgICAgICAgdmFyIHRpbWVSYW5nZU9iaixcbiAgICAgICAgICAgICAgICBpLFxuICAgICAgICAgICAgICAgIGxlbmd0aCA9IHNvdXJjZUJ1ZmZlci5idWZmZXJlZC5sZW5ndGg7XG5cbiAgICAgICAgICAgIGZvciAoaT0wOyBpPGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGltZVJhbmdlT2JqID0gY3JlYXRlVGltZVJhbmdlT2JqZWN0KHNvdXJjZUJ1ZmZlciwgaSwgdHJhbnNmb3JtRm4pO1xuICAgICAgICAgICAgICAgIGlmICgodGltZVJhbmdlT2JqLmdldFN0YXJ0KCkgLSB0b2xlcmFuY2UpID4gdGltZSkgeyByZXR1cm4gbnVsbDsgfVxuICAgICAgICAgICAgICAgIGlmICgodGltZVJhbmdlT2JqLmdldEVuZCgpICsgdG9sZXJhbmNlKSA+IHRpbWUpIHsgcmV0dXJuIHRpbWVSYW5nZU9iajsgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUFsaWduZWRCdWZmZXJlZFRpbWVSYW5nZUxpc3Qoc291cmNlQnVmZmVyLCBzZWdtZW50RHVyYXRpb24pIHtcbiAgICBmdW5jdGlvbiB0aW1lQWxpZ25UcmFuc2Zvcm1Gbih0aW1lKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHRpbWUgLyBzZWdtZW50RHVyYXRpb24pICogc2VnbWVudER1cmF0aW9uO1xuICAgIH1cblxuICAgIHJldHVybiBjcmVhdGVCdWZmZXJlZFRpbWVSYW5nZUxpc3Qoc291cmNlQnVmZmVyLCB0aW1lQWxpZ25UcmFuc2Zvcm1Gbik7XG59XG5cbi8qKlxuICogU291cmNlQnVmZmVyRGF0YVF1ZXVlIGFkZHMvcXVldWVzIHNlZ21lbnRzIHRvIHRoZSBjb3JyZXNwb25kaW5nIE1TRSBTb3VyY2VCdWZmZXIgKE5PVEU6IFRoZXJlIHNob3VsZCBiZSBvbmUgcGVyIG1lZGlhIHR5cGUvbWVkaWEgc2V0KVxuICpcbiAqIEBwYXJhbSBzb3VyY2VCdWZmZXIge1NvdXJjZUJ1ZmZlcn0gICBNU0UgU291cmNlQnVmZmVyIGluc3RhbmNlXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gU291cmNlQnVmZmVyRGF0YVF1ZXVlKHNvdXJjZUJ1ZmZlcikge1xuICAgIC8vIFRPRE86IENoZWNrIHR5cGU/XG4gICAgaWYgKCFzb3VyY2VCdWZmZXIpIHsgdGhyb3cgbmV3IEVycm9yKCAnVGhlIHNvdXJjZUJ1ZmZlciBjb25zdHJ1Y3RvciBhcmd1bWVudCBjYW5ub3QgYmUgbnVsbC4nICk7IH1cblxuICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgZGF0YVF1ZXVlID0gW107XG4gICAgLy8gVE9ETzogZmlndXJlIG91dCBob3cgd2Ugd2FudCB0byByZXNwb25kIHRvIG90aGVyIGV2ZW50IHN0YXRlcyAodXBkYXRlZW5kPyBlcnJvcj8gYWJvcnQ/KSAocmV0cnk/IHJlbW92ZT8pXG4gICAgc291cmNlQnVmZmVyLmFkZEV2ZW50TGlzdGVuZXIoJ3VwZGF0ZWVuZCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIC8vIFRoZSBTb3VyY2VCdWZmZXIgaW5zdGFuY2UncyB1cGRhdGluZyBwcm9wZXJ0eSBzaG91bGQgYWx3YXlzIGJlIGZhbHNlIGlmIHRoaXMgZXZlbnQgd2FzIGRpc3BhdGNoZWQsXG4gICAgICAgIC8vIGJ1dCBqdXN0IGluIGNhc2UuLi5cbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldC51cGRhdGluZykgeyByZXR1cm47IH1cblxuICAgICAgICBzZWxmLnRyaWdnZXIoeyB0eXBlOnNlbGYuZXZlbnRMaXN0LlNFR01FTlRfQURERURfVE9fQlVGRkVSLCB0YXJnZXQ6c2VsZiB9KTtcblxuICAgICAgICBpZiAoc2VsZi5fX2RhdGFRdWV1ZS5sZW5ndGggPD0gMCkge1xuICAgICAgICAgICAgc2VsZi50cmlnZ2VyKHsgdHlwZTpzZWxmLmV2ZW50TGlzdC5RVUVVRV9FTVBUWSwgdGFyZ2V0OnNlbGYgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLl9fc291cmNlQnVmZmVyLmFwcGVuZEJ1ZmZlcihzZWxmLl9fZGF0YVF1ZXVlLnNoaWZ0KCkpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5fX2RhdGFRdWV1ZSA9IGRhdGFRdWV1ZTtcbiAgICB0aGlzLl9fc291cmNlQnVmZmVyID0gc291cmNlQnVmZmVyO1xufVxuXG4vKipcbiAqIEVudW1lcmF0aW9uIG9mIGV2ZW50cyBpbnN0YW5jZXMgb2YgdGhpcyBvYmplY3Qgd2lsbCBkaXNwYXRjaC5cbiAqL1xuU291cmNlQnVmZmVyRGF0YVF1ZXVlLnByb3RvdHlwZS5ldmVudExpc3QgPSB7XG4gICAgUVVFVUVfRU1QVFk6ICdxdWV1ZUVtcHR5JyxcbiAgICBTRUdNRU5UX0FEREVEX1RPX0JVRkZFUjogJ3NlZ21lbnRBZGRlZFRvQnVmZmVyJ1xufTtcblxuU291cmNlQnVmZmVyRGF0YVF1ZXVlLnByb3RvdHlwZS5hZGRUb1F1ZXVlID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciBkYXRhVG9BZGRJbW1lZGlhdGVseTtcbiAgICBpZiAoIWV4aXN0eShkYXRhKSB8fCAoaXNBcnJheShkYXRhKSAmJiBkYXRhLmxlbmd0aCA8PSAwKSkgeyByZXR1cm47IH1cbiAgICAvLyBUcmVhdCBhbGwgZGF0YSBhcyBhcnJheXMgdG8gbWFrZSBzdWJzZXF1ZW50IGZ1bmN0aW9uYWxpdHkgZ2VuZXJpYy5cbiAgICBpZiAoIWlzQXJyYXkoZGF0YSkpIHsgZGF0YSA9IFtkYXRhXTsgfVxuICAgIC8vIElmIG5vdGhpbmcgaXMgaW4gdGhlIHF1ZXVlLCBnbyBhaGVhZCBhbmQgaW1tZWRpYXRlbHkgYXBwZW5kIHRoZSBmaXJzdCBkYXRhIHRvIHRoZSBzb3VyY2UgYnVmZmVyLlxuICAgIGlmICgodGhpcy5fX2RhdGFRdWV1ZS5sZW5ndGggPT09IDApICYmICghdGhpcy5fX3NvdXJjZUJ1ZmZlci51cGRhdGluZykpIHsgZGF0YVRvQWRkSW1tZWRpYXRlbHkgPSBkYXRhLnNoaWZ0KCk7IH1cbiAgICAvLyBJZiBhbnkgb3RoZXIgZGF0YSAoc3RpbGwpIGV4aXN0cywgcHVzaCB0aGUgcmVzdCBvbnRvIHRoZSBkYXRhUXVldWUuXG4gICAgdGhpcy5fX2RhdGFRdWV1ZSA9IHRoaXMuX19kYXRhUXVldWUuY29uY2F0KGRhdGEpO1xuICAgIGlmIChleGlzdHkoZGF0YVRvQWRkSW1tZWRpYXRlbHkpKSB7IHRoaXMuX19zb3VyY2VCdWZmZXIuYXBwZW5kQnVmZmVyKGRhdGFUb0FkZEltbWVkaWF0ZWx5KTsgfVxufTtcblxuU291cmNlQnVmZmVyRGF0YVF1ZXVlLnByb3RvdHlwZS5jbGVhclF1ZXVlID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fX2RhdGFRdWV1ZSA9IFtdO1xufTtcblxuU291cmNlQnVmZmVyRGF0YVF1ZXVlLnByb3RvdHlwZS5nZXRCdWZmZXJlZFRpbWVSYW5nZUxpc3QgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gY3JlYXRlQnVmZmVyZWRUaW1lUmFuZ2VMaXN0KHRoaXMuX19zb3VyY2VCdWZmZXIpO1xufTtcblxuU291cmNlQnVmZmVyRGF0YVF1ZXVlLnByb3RvdHlwZS5nZXRCdWZmZXJlZFRpbWVSYW5nZUxpc3RBbGlnbmVkVG9TZWdtZW50RHVyYXRpb24gPSBmdW5jdGlvbihzZWdtZW50RHVyYXRpb24pIHtcbiAgICByZXR1cm4gY3JlYXRlQWxpZ25lZEJ1ZmZlcmVkVGltZVJhbmdlTGlzdCh0aGlzLl9fc291cmNlQnVmZmVyLCBzZWdtZW50RHVyYXRpb24pO1xufTtcblxuLy8gQWRkIGV2ZW50IGRpc3BhdGNoZXIgZnVuY3Rpb25hbGl0eSB0byBwcm90b3R5cGUuXG5leHRlbmRPYmplY3QoU291cmNlQnVmZmVyRGF0YVF1ZXVlLnByb3RvdHlwZSwgRXZlbnREaXNwYXRjaGVyTWl4aW4pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNvdXJjZUJ1ZmZlckRhdGFRdWV1ZTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBNZWRpYVNvdXJjZSA9IHJlcXVpcmUoJ2dsb2JhbC93aW5kb3cnKS5NZWRpYVNvdXJjZSxcbiAgICBEZWNyeXB0ZXIgPSByZXF1aXJlKCcuL2RlY3J5cHRlcicpLFxuICAgIE1hbmlmZXN0Q29udHJvbGxlciA9IHJlcXVpcmUoJy4vbWFuaWZlc3QvTWFuaWZlc3RDb250cm9sbGVyLmpzJyksXG4gICAgUGxheWxpc3RMb2FkZXIgPSByZXF1aXJlKCcuL1BsYXlsaXN0TG9hZGVyLmpzJyk7XG5cbi8vIFRPRE86IERJU1BPU0UgTUVUSE9EXG4vKipcbiAqXG4gKiBDbGFzcyB0aGF0IGRlZmluZXMgdGhlIHJvb3QgY29udGV4dCBmb3IgaGFuZGxpbmcgYSBzcGVjaWZpYyBNUEVHLURBU0ggbWVkaWEgc291cmNlLlxuICpcbiAqIEBwYXJhbSBzb3VyY2UgICAgdmlkZW8uanMgc291cmNlIG9iamVjdCBwcm92aWRpbmcgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHNvdXJjZSwgc3VjaCBhcyB0aGUgdXJpIChzcmMpIGFuZCB0aGUgdHlwZSAodHlwZSlcbiAqIEBwYXJhbSB0ZWNoICAgICAgdmlkZW8uanMgSHRtbDUgdGVjaCBvYmplY3QgcHJvdmlkaW5nIHRoZSBwb2ludCBvZiBpbnRlcmFjdGlvbiBiZXR3ZWVuIHRoZSBTb3VyY2VIYW5kbGVyIGluc3RhbmNlIGFuZFxuICogICAgICAgICAgICAgICAgICB0aGUgdmlkZW8uanMgbGlicmFyeSAoaW5jbHVkaW5nIGUuZy4gdGhlIHZpZGVvIGVsZW1lbnQpXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gU291cmNlSGFuZGxlcihzb3VyY2UsIHRlY2gpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgIG1hbmlmZXN0Q29udHJvbGxlciA9IG5ldyBNYW5pZmVzdENvbnRyb2xsZXIoc291cmNlLnNyYywgZmFsc2UpLFxuICAgICAgICBkZWNyeXB0ZXIgPSBuZXcgRGVjcnlwdGVyKHRlY2gpO1xuXG4gICAgbWFuaWZlc3RDb250cm9sbGVyLm9uZShtYW5pZmVzdENvbnRyb2xsZXIuZXZlbnRMaXN0Lk1BTklGRVNUX0xPQURFRCwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIG1lZGlhU291cmNlID0gbmV3IE1lZGlhU291cmNlKCksXG4gICAgICAgICAgICBvcGVuTGlzdGVuZXIgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgIG1lZGlhU291cmNlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3NvdXJjZW9wZW4nLCBvcGVuTGlzdGVuZXIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9fcGxheWxpc3RMb2FkZXIgPSBuZXcgUGxheWxpc3RMb2FkZXIobWFuaWZlc3RDb250cm9sbGVyLCBtZWRpYVNvdXJjZSwgdGVjaCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIG1lZGlhU291cmNlLmFkZEV2ZW50TGlzdGVuZXIoJ3NvdXJjZW9wZW4nLCBvcGVuTGlzdGVuZXIsIGZhbHNlKTtcblxuICAgICAgICAvLyBUT0RPOiBIYW5kbGUgY2xvc2UuXG4gICAgICAgIC8vbWVkaWFTb3VyY2UuYWRkRXZlbnRMaXN0ZW5lcignd2Via2l0c291cmNlY2xvc2UnLCBjbG9zZWQsIGZhbHNlKTtcbiAgICAgICAgLy9tZWRpYVNvdXJjZS5hZGRFdmVudExpc3RlbmVyKCdzb3VyY2VjbG9zZScsIGNsb3NlZCwgZmFsc2UpO1xuXG4gICAgICAgIHRlY2guc2V0U3JjKFVSTC5jcmVhdGVPYmplY3RVUkwobWVkaWFTb3VyY2UpKTtcbiAgICB9KTtcblxuICAgIG1hbmlmZXN0Q29udHJvbGxlci5sb2FkKCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU291cmNlSGFuZGxlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHBhcnNlUm9vdFVybCxcbiAgICAvLyBUT0RPOiBTaG91bGQgcHJlc2VudGF0aW9uRHVyYXRpb24gcGFyc2luZyBiZSBpbiB1dGlsIG9yIHNvbWV3aGVyZSBlbHNlP1xuICAgIHBhcnNlTWVkaWFQcmVzZW50YXRpb25EdXJhdGlvbixcbiAgICBwYXJzZURhdGVUaW1lLFxuICAgIFNFQ09ORFNfSU5fWUVBUiA9IDM2NSAqIDI0ICogNjAgKiA2MCxcbiAgICBTRUNPTkRTX0lOX01PTlRIID0gMzAgKiAyNCAqIDYwICogNjAsIC8vIG5vdCBwcmVjaXNlIVxuICAgIFNFQ09ORFNfSU5fREFZID0gMjQgKiA2MCAqIDYwLFxuICAgIFNFQ09ORFNfSU5fSE9VUiA9IDYwICogNjAsXG4gICAgU0VDT05EU19JTl9NSU4gPSA2MCxcbiAgICBNSU5VVEVTX0lOX0hPVVIgPSA2MCxcbiAgICBNSUxMSVNFQ09ORFNfSU5fU0VDT05EUyA9IDEwMDAsXG4gICAgZHVyYXRpb25SZWdleCA9IC9eUCgoW1xcZC5dKilZKT8oKFtcXGQuXSopTSk/KChbXFxkLl0qKUQpP1Q/KChbXFxkLl0qKUgpPygoW1xcZC5dKilNKT8oKFtcXGQuXSopUyk/LyxcbiAgICBkYXRlVGltZVJlZ2V4ID0gL14oWzAtOV17NH0pLShbMC05XXsyfSktKFswLTldezJ9KVQoWzAtOV17Mn0pOihbMC05XXsyfSkoPzo6KFswLTldKikoXFwuWzAtOV0qKT8pPyg/OihbKy1dKShbMC05XXsyfSkoWzAtOV17Mn0pKT8vO1xuXG5wYXJzZVJvb3RVcmwgPSBmdW5jdGlvbih1cmwpIHtcbiAgICBpZiAodHlwZW9mIHVybCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cblxuICAgIGlmICh1cmwuaW5kZXhPZignLycpID09PSAtMSkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuXG4gICAgaWYgKHVybC5pbmRleE9mKCc/JykgIT09IC0xKSB7XG4gICAgICAgIHVybCA9IHVybC5zdWJzdHJpbmcoMCwgdXJsLmluZGV4T2YoJz8nKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHVybC5zdWJzdHJpbmcoMCwgdXJsLmxhc3RJbmRleE9mKCcvJykgKyAxKTtcbn07XG5cbi8vIFRPRE86IFNob3VsZCBwcmVzZW50YXRpb25EdXJhdGlvbiBwYXJzaW5nIGJlIGluIHV0aWwgb3Igc29tZXdoZXJlIGVsc2U/XG5wYXJzZU1lZGlhUHJlc2VudGF0aW9uRHVyYXRpb24gPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgLy9zdHIgPSBcIlAxMFkxME0xMERUMTBIMTBNMTAuMVNcIjtcbiAgICBpZiAoIXN0cikgeyByZXR1cm4gTnVtYmVyLk5hTjsgfVxuICAgIHZhciBtYXRjaCA9IGR1cmF0aW9uUmVnZXguZXhlYyhzdHIpO1xuICAgIGlmICghbWF0Y2gpIHsgcmV0dXJuIE51bWJlci5OYU47IH1cbiAgICByZXR1cm4gKHBhcnNlRmxvYXQobWF0Y2hbMl0gfHwgMCkgKiBTRUNPTkRTX0lOX1lFQVIgK1xuICAgICAgICBwYXJzZUZsb2F0KG1hdGNoWzRdIHx8IDApICogU0VDT05EU19JTl9NT05USCArXG4gICAgICAgIHBhcnNlRmxvYXQobWF0Y2hbNl0gfHwgMCkgKiBTRUNPTkRTX0lOX0RBWSArXG4gICAgICAgIHBhcnNlRmxvYXQobWF0Y2hbOF0gfHwgMCkgKiBTRUNPTkRTX0lOX0hPVVIgK1xuICAgICAgICBwYXJzZUZsb2F0KG1hdGNoWzEwXSB8fCAwKSAqIFNFQ09ORFNfSU5fTUlOICtcbiAgICAgICAgcGFyc2VGbG9hdChtYXRjaFsxMl0gfHwgMCkpO1xufTtcblxuLyoqXG4gKiBQYXJzZXIgZm9yIGZvcm1hdHRlZCBkYXRldGltZSBzdHJpbmdzIGNvbmZvcm1pbmcgdG8gdGhlIElTTyA4NjAxIHN0YW5kYXJkLlxuICogR2VuZXJhbCBGb3JtYXQ6ICBZWVlZLU1NLUREVEhIOk1NOlNTWiAoVVRDKSBvciBZWVlZLU1NLUREVEhIOk1NOlNTK0hIOk1NICh0aW1lIHpvbmUgbG9jYWxpemF0aW9uKVxuICogRXggU3RyaW5nOiAgICAgICAyMDE0LTEyLTE3VDE0OjA5OjU4WiAoVVRDKSBvciAyMDE0LTEyLTE3VDE0OjE1OjU4KzA2OjAwICh0aW1lIHpvbmUgbG9jYWxpemF0aW9uKSAvIDIwMTQtMTItMTdUMTQ6MDM6NTgtMDY6MDAgKHRpbWUgem9uZSBsb2NhbGl6YXRpb24pXG4gKlxuICogQHBhcmFtIHN0ciB7c3RyaW5nfSAgSVNPIDg2MDEtY29tcGxpYW50IGRhdGV0aW1lIHN0cmluZy5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IFVUQyBVbml4IHRpbWUuXG4gKi9cbnBhcnNlRGF0ZVRpbWUgPSBmdW5jdGlvbihzdHIpIHtcbiAgICB2YXIgbWF0Y2ggPSBkYXRlVGltZVJlZ2V4LmV4ZWMoc3RyKSxcbiAgICAgICAgdXRjRGF0ZTtcblxuICAgIC8vIElmIHRoZSBzdHJpbmcgZG9lcyBub3QgY29udGFpbiBhIHRpbWV6b25lIG9mZnNldCBkaWZmZXJlbnQgYnJvd3NlcnMgY2FuIGludGVycHJldCBpdCBlaXRoZXJcbiAgICAvLyBhcyBVVEMgb3IgYXMgYSBsb2NhbCB0aW1lIHNvIHdlIGhhdmUgdG8gcGFyc2UgdGhlIHN0cmluZyBtYW51YWxseSB0byBub3JtYWxpemUgdGhlIGdpdmVuIGRhdGUgdmFsdWUgZm9yXG4gICAgLy8gYWxsIGJyb3dzZXJzXG4gICAgdXRjRGF0ZSA9IERhdGUuVVRDKFxuICAgICAgICBwYXJzZUludChtYXRjaFsxXSwgMTApLFxuICAgICAgICBwYXJzZUludChtYXRjaFsyXSwgMTApLTEsIC8vIG1vbnRocyBzdGFydCBmcm9tIHplcm9cbiAgICAgICAgcGFyc2VJbnQobWF0Y2hbM10sIDEwKSxcbiAgICAgICAgcGFyc2VJbnQobWF0Y2hbNF0sIDEwKSxcbiAgICAgICAgcGFyc2VJbnQobWF0Y2hbNV0sIDEwKSxcbiAgICAgICAgKG1hdGNoWzZdICYmIHBhcnNlSW50KG1hdGNoWzZdLCAxMCkgfHwgMCksXG4gICAgICAgIChtYXRjaFs3XSAmJiBwYXJzZUZsb2F0KG1hdGNoWzddKSAqIE1JTExJU0VDT05EU19JTl9TRUNPTkRTKSB8fCAwKTtcbiAgICAvLyBJZiB0aGUgZGF0ZSBoYXMgdGltZXpvbmUgb2Zmc2V0IHRha2UgaXQgaW50byBhY2NvdW50IGFzIHdlbGxcbiAgICBpZiAobWF0Y2hbOV0gJiYgbWF0Y2hbMTBdKSB7XG4gICAgICAgIHZhciB0aW1lem9uZU9mZnNldCA9IHBhcnNlSW50KG1hdGNoWzldLCAxMCkgKiBNSU5VVEVTX0lOX0hPVVIgKyBwYXJzZUludChtYXRjaFsxMF0sIDEwKTtcbiAgICAgICAgdXRjRGF0ZSArPSAobWF0Y2hbOF0gPT09ICcrJyA/IC0xIDogKzEpICogdGltZXpvbmVPZmZzZXQgKiBTRUNPTkRTX0lOX01JTiAqIE1JTExJU0VDT05EU19JTl9TRUNPTkRTO1xuICAgIH1cblxuICAgIHJldHVybiB1dGNEYXRlO1xufTtcblxudmFyIGRhc2hVdGlsID0ge1xuICAgIHBhcnNlUm9vdFVybDogcGFyc2VSb290VXJsLFxuICAgIHBhcnNlTWVkaWFQcmVzZW50YXRpb25EdXJhdGlvbjogcGFyc2VNZWRpYVByZXNlbnRhdGlvbkR1cmF0aW9uLFxuICAgIHBhcnNlRGF0ZVRpbWU6IHBhcnNlRGF0ZVRpbWVcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2V0RGFzaFV0aWwoKSB7IHJldHVybiBkYXNoVXRpbDsgfTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBnZXRYbWxGdW4gPSByZXF1aXJlKCcuLi8uLi9nZXRYbWxGdW4uanMnKSxcbiAgICB4bWxGdW4gPSBnZXRYbWxGdW4oKSxcbiAgICBnZXREYXNoVXRpbCA9IHJlcXVpcmUoJy4vZ2V0RGFzaFV0aWwuanMnKSxcbiAgICBkYXNoVXRpbCA9IGdldERhc2hVdGlsKCksXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvaXNBcnJheS5qcycpLFxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCcuLi8uLi91dGlsL2lzRnVuY3Rpb24uanMnKSxcbiAgICBpc1N0cmluZyA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvaXNTdHJpbmcuanMnKSxcbiAgICBwYXJzZVJvb3RVcmwgPSBkYXNoVXRpbC5wYXJzZVJvb3RVcmwsXG4gICAgY3JlYXRlTXBkT2JqZWN0LFxuICAgIGNyZWF0ZVBlcmlvZE9iamVjdCxcbiAgICBjcmVhdGVBZGFwdGF0aW9uU2V0T2JqZWN0LFxuICAgIGNyZWF0ZVJlcHJlc2VudGF0aW9uT2JqZWN0LFxuICAgIGNyZWF0ZVNlZ21lbnRUZW1wbGF0ZSxcbiAgICBnZXRNcGQsXG4gICAgZ2V0QWRhcHRhdGlvblNldEJ5VHlwZSxcbiAgICBnZXREZXNjZW5kYW50T2JqZWN0c0FycmF5QnlOYW1lLFxuICAgIGdldEFuY2VzdG9yT2JqZWN0QnlOYW1lO1xuXG4vLyBUT0RPOiBTaG91bGQgdGhpcyBleGlzdCBvbiBtcGQgZGF0YXZpZXcgb3IgYXQgYSBoaWdoZXIgbGV2ZWw/XG4vLyBUT0RPOiBSZWZhY3Rvci4gQ291bGQgYmUgbW9yZSBlZmZpY2llbnQgKFJlY3Vyc2l2ZSBmbj8gVXNlIGVsZW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ0Jhc2VVcmwnKVswXT8pLlxuLy8gVE9ETzogQ3VycmVudGx5IGFzc3VtaW5nICpFSVRIRVIqIDxCYXNlVVJMPiBub2RlcyB3aWxsIHByb3ZpZGUgYW4gYWJzb2x1dGUgYmFzZSB1cmwgKGllIHJlc29sdmUgdG8gJ2h0dHA6Ly8nIGV0Yylcbi8vIFRPRE86ICpPUiogd2Ugc2hvdWxkIHVzZSB0aGUgYmFzZSB1cmwgb2YgdGhlIGhvc3Qgb2YgdGhlIE1QRCBtYW5pZmVzdC5cbnZhciBidWlsZEJhc2VVcmwgPSBmdW5jdGlvbih4bWxOb2RlKSB7XG4gICAgdmFyIGVsZW1IaWVyYXJjaHkgPSBbeG1sTm9kZV0uY29uY2F0KHhtbEZ1bi5nZXRBbmNlc3RvcnMoeG1sTm9kZSkpLFxuICAgICAgICBmb3VuZExvY2FsQmFzZVVybCA9IGZhbHNlO1xuICAgIHZhciBiYXNlVXJscyA9IGVsZW1IaWVyYXJjaHkubWFwKGZ1bmN0aW9uKGVsZW0pIHtcbiAgICAgICAgaWYgKGZvdW5kTG9jYWxCYXNlVXJsKSB7IHJldHVybiAnJzsgfVxuICAgICAgICBpZiAoIWVsZW0uaGFzQ2hpbGROb2RlcygpKSB7IHJldHVybiAnJzsgfVxuICAgICAgICB2YXIgY2hpbGQ7XG4gICAgICAgIGZvciAodmFyIGk9MDsgaTxlbGVtLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNoaWxkID0gZWxlbS5jaGlsZE5vZGVzLml0ZW0oaSk7XG4gICAgICAgICAgICBpZiAoY2hpbGQubm9kZU5hbWUgPT09ICdCYXNlVVJMJykge1xuICAgICAgICAgICAgICAgIHZhciB0ZXh0RWxlbSA9IGNoaWxkLmNoaWxkTm9kZXMuaXRlbSgwKTtcbiAgICAgICAgICAgICAgICB2YXIgdGV4dFZhbHVlID0gdGV4dEVsZW0ud2hvbGVUZXh0LnRyaW0oKTtcbiAgICAgICAgICAgICAgICBpZiAodGV4dFZhbHVlLmluZGV4T2YoJ2h0dHA6Ly8nKSA9PT0gMCkgeyBmb3VuZExvY2FsQmFzZVVybCA9IHRydWU7IH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGV4dEVsZW0ud2hvbGVUZXh0LnRyaW0oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAnJztcbiAgICB9KTtcblxuICAgIHZhciBiYXNlVXJsID0gYmFzZVVybHMucmV2ZXJzZSgpLmpvaW4oJycpO1xuICAgIGlmICghYmFzZVVybCkgeyByZXR1cm4gcGFyc2VSb290VXJsKHhtbE5vZGUuYmFzZVVSSSk7IH1cbiAgICByZXR1cm4gYmFzZVVybDtcbn07XG5cbnZhciBlbGVtc1dpdGhDb21tb25Qcm9wZXJ0aWVzID0gW1xuICAgICdBZGFwdGF0aW9uU2V0JyxcbiAgICAnUmVwcmVzZW50YXRpb24nLFxuICAgICdTdWJSZXByZXNlbnRhdGlvbidcbl07XG5cbnZhciBoYXNDb21tb25Qcm9wZXJ0aWVzID0gZnVuY3Rpb24oZWxlbSkge1xuICAgIHJldHVybiBlbGVtc1dpdGhDb21tb25Qcm9wZXJ0aWVzLmluZGV4T2YoZWxlbS5ub2RlTmFtZSkgPj0gMDtcbn07XG5cbnZhciBkb2VzbnRIYXZlQ29tbW9uUHJvcGVydGllcyA9IGZ1bmN0aW9uKGVsZW0pIHtcbiAgICByZXR1cm4gIWhhc0NvbW1vblByb3BlcnRpZXMoZWxlbSk7XG59O1xuXG4vLyBDb21tb24gQXR0cnNcbnZhciBnZXRXaWR0aCA9IHhtbEZ1bi5nZXRJbmhlcml0YWJsZUF0dHJpYnV0ZSgnd2lkdGgnKSxcbiAgICBnZXRIZWlnaHQgPSB4bWxGdW4uZ2V0SW5oZXJpdGFibGVBdHRyaWJ1dGUoJ2hlaWdodCcpLFxuICAgIGdldEZyYW1lUmF0ZSA9IHhtbEZ1bi5nZXRJbmhlcml0YWJsZUF0dHJpYnV0ZSgnZnJhbWVSYXRlJyksXG4gICAgZ2V0TWltZVR5cGUgPSB4bWxGdW4uZ2V0SW5oZXJpdGFibGVBdHRyaWJ1dGUoJ21pbWVUeXBlJyksXG4gICAgZ2V0Q29kZWNzID0geG1sRnVuLmdldEluaGVyaXRhYmxlQXR0cmlidXRlKCdjb2RlY3MnKTtcblxudmFyIGdldFNlZ21lbnRUZW1wbGF0ZVhtbExpc3QgPSB4bWxGdW4uZ2V0TXVsdGlMZXZlbEVsZW1lbnRMaXN0KCdTZWdtZW50VGVtcGxhdGUnKTtcblxuLy8gTVBEIEF0dHIgZm5zXG52YXIgZ2V0TWVkaWFQcmVzZW50YXRpb25EdXJhdGlvbiA9IHhtbEZ1bi5nZXRBdHRyRm4oJ21lZGlhUHJlc2VudGF0aW9uRHVyYXRpb24nKSxcbiAgICBnZXRUeXBlID0geG1sRnVuLmdldEF0dHJGbigndHlwZScpLFxuICAgIGdldE1pbmltdW1VcGRhdGVQZXJpb2QgPSB4bWxGdW4uZ2V0QXR0ckZuKCdtaW5pbXVtVXBkYXRlUGVyaW9kJyksXG4gICAgZ2V0QXZhaWxhYmlsaXR5U3RhcnRUaW1lID0geG1sRnVuLmdldEF0dHJGbignYXZhaWxhYmlsaXR5U3RhcnRUaW1lJyksXG4gICAgZ2V0U3VnZ2VzdGVkUHJlc2VudGF0aW9uRGVsYXkgPSB4bWxGdW4uZ2V0QXR0ckZuKCdzdWdnZXN0ZWRQcmVzZW50YXRpb25EZWxheScpLFxuICAgIGdldFRpbWVTaGlmdEJ1ZmZlckRlcHRoID0geG1sRnVuLmdldEF0dHJGbigndGltZVNoaWZ0QnVmZmVyRGVwdGgnKTtcblxuLy8gUmVwcmVzZW50YXRpb24gQXR0ciBmbnNcbnZhciBnZXRJZCA9IHhtbEZ1bi5nZXRBdHRyRm4oJ2lkJyksXG4gICAgZ2V0QmFuZHdpZHRoID0geG1sRnVuLmdldEF0dHJGbignYmFuZHdpZHRoJyk7XG5cbi8vIFNlZ21lbnRUZW1wbGF0ZSBBdHRyIGZuc1xudmFyIGdldEluaXRpYWxpemF0aW9uID0geG1sRnVuLmdldEF0dHJGbignaW5pdGlhbGl6YXRpb24nKSxcbiAgICBnZXRNZWRpYSA9IHhtbEZ1bi5nZXRBdHRyRm4oJ21lZGlhJyksXG4gICAgZ2V0RHVyYXRpb24gPSB4bWxGdW4uZ2V0QXR0ckZuKCdkdXJhdGlvbicpLFxuICAgIGdldFRpbWVzY2FsZSA9IHhtbEZ1bi5nZXRBdHRyRm4oJ3RpbWVzY2FsZScpLFxuICAgIGdldFByZXNlbnRhdGlvblRpbWVPZmZzZXQgPSB4bWxGdW4uZ2V0QXR0ckZuKCdwcmVzZW50YXRpb25UaW1lT2Zmc2V0JyksXG4gICAgZ2V0U3RhcnROdW1iZXIgPSB4bWxGdW4uZ2V0QXR0ckZuKCdzdGFydE51bWJlcicpO1xuXG4vLyBUT0RPOiBSZXBlYXQgY29kZS4gQWJzdHJhY3QgYXdheSAoUHJvdG90eXBhbCBJbmhlcml0YW5jZS9PTyBNb2RlbD8gT2JqZWN0IGNvbXBvc2VyIGZuPylcbmNyZWF0ZU1wZE9iamVjdCA9IGZ1bmN0aW9uKHhtbE5vZGUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB4bWw6IHhtbE5vZGUsXG4gICAgICAgIC8vIERlc2NlbmRhbnRzLCBBbmNlc3RvcnMsICYgU2libGluZ3NcbiAgICAgICAgZ2V0UGVyaW9kczogeG1sRnVuLnByZUFwcGx5QXJnc0ZuKGdldERlc2NlbmRhbnRPYmplY3RzQXJyYXlCeU5hbWUsIHhtbE5vZGUsICdQZXJpb2QnLCBjcmVhdGVQZXJpb2RPYmplY3QpLFxuICAgICAgICBnZXRNZWRpYVByZXNlbnRhdGlvbkR1cmF0aW9uOiB4bWxGdW4ucHJlQXBwbHlBcmdzRm4oZ2V0TWVkaWFQcmVzZW50YXRpb25EdXJhdGlvbiwgeG1sTm9kZSksXG4gICAgICAgIGdldFR5cGU6IHhtbEZ1bi5wcmVBcHBseUFyZ3NGbihnZXRUeXBlLCB4bWxOb2RlKSxcbiAgICAgICAgZ2V0TWluaW11bVVwZGF0ZVBlcmlvZDogeG1sRnVuLnByZUFwcGx5QXJnc0ZuKGdldE1pbmltdW1VcGRhdGVQZXJpb2QsIHhtbE5vZGUpLFxuICAgICAgICBnZXRBdmFpbGFiaWxpdHlTdGFydFRpbWU6IHhtbEZ1bi5wcmVBcHBseUFyZ3NGbihnZXRBdmFpbGFiaWxpdHlTdGFydFRpbWUsIHhtbE5vZGUpLFxuICAgICAgICBnZXRTdWdnZXN0ZWRQcmVzZW50YXRpb25EZWxheTogeG1sRnVuLnByZUFwcGx5QXJnc0ZuKGdldFN1Z2dlc3RlZFByZXNlbnRhdGlvbkRlbGF5LCB4bWxOb2RlKSxcbiAgICAgICAgZ2V0VGltZVNoaWZ0QnVmZmVyRGVwdGg6IHhtbEZ1bi5wcmVBcHBseUFyZ3NGbihnZXRUaW1lU2hpZnRCdWZmZXJEZXB0aCwgeG1sTm9kZSlcbiAgICB9O1xufTtcblxuY3JlYXRlUGVyaW9kT2JqZWN0ID0gZnVuY3Rpb24oeG1sTm9kZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHhtbDogeG1sTm9kZSxcbiAgICAgICAgLy8gRGVzY2VuZGFudHMsIEFuY2VzdG9ycywgJiBTaWJsaW5nc1xuICAgICAgICBnZXRBZGFwdGF0aW9uU2V0czogeG1sRnVuLnByZUFwcGx5QXJnc0ZuKGdldERlc2NlbmRhbnRPYmplY3RzQXJyYXlCeU5hbWUsIHhtbE5vZGUsICdBZGFwdGF0aW9uU2V0JywgY3JlYXRlQWRhcHRhdGlvblNldE9iamVjdCksXG4gICAgICAgIGdldEFkYXB0YXRpb25TZXRCeVR5cGU6IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRBZGFwdGF0aW9uU2V0QnlUeXBlKHR5cGUsIHhtbE5vZGUpO1xuICAgICAgICB9LFxuICAgICAgICBnZXRNcGQ6IHhtbEZ1bi5wcmVBcHBseUFyZ3NGbihnZXRBbmNlc3Rvck9iamVjdEJ5TmFtZSwgeG1sTm9kZSwgJ01QRCcsIGNyZWF0ZU1wZE9iamVjdClcbiAgICB9O1xufTtcblxuY3JlYXRlQWRhcHRhdGlvblNldE9iamVjdCA9IGZ1bmN0aW9uKHhtbE5vZGUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB4bWw6IHhtbE5vZGUsXG4gICAgICAgIC8vIERlc2NlbmRhbnRzLCBBbmNlc3RvcnMsICYgU2libGluZ3NcbiAgICAgICAgZ2V0UmVwcmVzZW50YXRpb25zOiB4bWxGdW4ucHJlQXBwbHlBcmdzRm4oZ2V0RGVzY2VuZGFudE9iamVjdHNBcnJheUJ5TmFtZSwgeG1sTm9kZSwgJ1JlcHJlc2VudGF0aW9uJywgY3JlYXRlUmVwcmVzZW50YXRpb25PYmplY3QpLFxuICAgICAgICBnZXRTZWdtZW50VGVtcGxhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZVNlZ21lbnRUZW1wbGF0ZShnZXRTZWdtZW50VGVtcGxhdGVYbWxMaXN0KHhtbE5vZGUpKTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0UGVyaW9kOiB4bWxGdW4ucHJlQXBwbHlBcmdzRm4oZ2V0QW5jZXN0b3JPYmplY3RCeU5hbWUsIHhtbE5vZGUsICdQZXJpb2QnLCBjcmVhdGVQZXJpb2RPYmplY3QpLFxuICAgICAgICBnZXRNcGQ6IHhtbEZ1bi5wcmVBcHBseUFyZ3NGbihnZXRBbmNlc3Rvck9iamVjdEJ5TmFtZSwgeG1sTm9kZSwgJ01QRCcsIGNyZWF0ZU1wZE9iamVjdCksXG4gICAgICAgIC8vIEF0dHJzXG4gICAgICAgIGdldE1pbWVUeXBlOiB4bWxGdW4ucHJlQXBwbHlBcmdzRm4oZ2V0TWltZVR5cGUsIHhtbE5vZGUpXG4gICAgfTtcbn07XG5cbmNyZWF0ZVJlcHJlc2VudGF0aW9uT2JqZWN0ID0gZnVuY3Rpb24oeG1sTm9kZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHhtbDogeG1sTm9kZSxcbiAgICAgICAgLy8gRGVzY2VuZGFudHMsIEFuY2VzdG9ycywgJiBTaWJsaW5nc1xuICAgICAgICBnZXRTZWdtZW50VGVtcGxhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZVNlZ21lbnRUZW1wbGF0ZShnZXRTZWdtZW50VGVtcGxhdGVYbWxMaXN0KHhtbE5vZGUpKTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0QWRhcHRhdGlvblNldDogeG1sRnVuLnByZUFwcGx5QXJnc0ZuKGdldEFuY2VzdG9yT2JqZWN0QnlOYW1lLCB4bWxOb2RlLCAnQWRhcHRhdGlvblNldCcsIGNyZWF0ZUFkYXB0YXRpb25TZXRPYmplY3QpLFxuICAgICAgICBnZXRQZXJpb2Q6IHhtbEZ1bi5wcmVBcHBseUFyZ3NGbihnZXRBbmNlc3Rvck9iamVjdEJ5TmFtZSwgeG1sTm9kZSwgJ1BlcmlvZCcsIGNyZWF0ZVBlcmlvZE9iamVjdCksXG4gICAgICAgIGdldE1wZDogeG1sRnVuLnByZUFwcGx5QXJnc0ZuKGdldEFuY2VzdG9yT2JqZWN0QnlOYW1lLCB4bWxOb2RlLCAnTVBEJywgY3JlYXRlTXBkT2JqZWN0KSxcbiAgICAgICAgLy8gQXR0cnNcbiAgICAgICAgZ2V0SWQ6IHhtbEZ1bi5wcmVBcHBseUFyZ3NGbihnZXRJZCwgeG1sTm9kZSksXG4gICAgICAgIGdldFdpZHRoOiB4bWxGdW4ucHJlQXBwbHlBcmdzRm4oZ2V0V2lkdGgsIHhtbE5vZGUpLFxuICAgICAgICBnZXRIZWlnaHQ6IHhtbEZ1bi5wcmVBcHBseUFyZ3NGbihnZXRIZWlnaHQsIHhtbE5vZGUpLFxuICAgICAgICBnZXRGcmFtZVJhdGU6IHhtbEZ1bi5wcmVBcHBseUFyZ3NGbihnZXRGcmFtZVJhdGUsIHhtbE5vZGUpLFxuICAgICAgICBnZXRCYW5kd2lkdGg6IHhtbEZ1bi5wcmVBcHBseUFyZ3NGbihnZXRCYW5kd2lkdGgsIHhtbE5vZGUpLFxuICAgICAgICBnZXRDb2RlY3M6IHhtbEZ1bi5wcmVBcHBseUFyZ3NGbihnZXRDb2RlY3MsIHhtbE5vZGUpLFxuICAgICAgICBnZXRCYXNlVXJsOiB4bWxGdW4ucHJlQXBwbHlBcmdzRm4oYnVpbGRCYXNlVXJsLCB4bWxOb2RlKSxcbiAgICAgICAgZ2V0TWltZVR5cGU6IHhtbEZ1bi5wcmVBcHBseUFyZ3NGbihnZXRNaW1lVHlwZSwgeG1sTm9kZSlcbiAgICB9O1xufTtcblxuY3JlYXRlU2VnbWVudFRlbXBsYXRlID0gZnVuY3Rpb24oeG1sQXJyYXkpIHtcbiAgICAvLyBFZmZlY3RpdmVseSBhIGZpbmQgZnVuY3Rpb24gKyBhIG1hcCBmdW5jdGlvbi5cbiAgICBmdW5jdGlvbiBnZXRBdHRyRnJvbVhtbEFycmF5KGF0dHJHZXR0ZXJGbiwgeG1sQXJyYXkpIHtcbiAgICAgICAgaWYgKCFpc0FycmF5KHhtbEFycmF5KSkgeyByZXR1cm4gdW5kZWZpbmVkOyB9XG4gICAgICAgIGlmICghaXNGdW5jdGlvbihhdHRyR2V0dGVyRm4pKSB7IHJldHVybiB1bmRlZmluZWQ7IH1cblxuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGxlbmd0aCA9IHhtbEFycmF5Lmxlbmd0aCxcbiAgICAgICAgICAgIGN1cnJlbnRBdHRyVmFsdWU7XG5cbiAgICAgICAgZm9yIChpPTA7IGk8eG1sQXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGN1cnJlbnRBdHRyVmFsdWUgPSBhdHRyR2V0dGVyRm4oeG1sQXJyYXlbaV0pO1xuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKGN1cnJlbnRBdHRyVmFsdWUpICYmIGN1cnJlbnRBdHRyVmFsdWUgIT09ICcnKSB7IHJldHVybiBjdXJyZW50QXR0clZhbHVlOyB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHhtbDogeG1sQXJyYXksXG4gICAgICAgIC8vIERlc2NlbmRhbnRzLCBBbmNlc3RvcnMsICYgU2libGluZ3NcbiAgICAgICAgZ2V0QWRhcHRhdGlvblNldDogeG1sRnVuLnByZUFwcGx5QXJnc0ZuKGdldEFuY2VzdG9yT2JqZWN0QnlOYW1lLCB4bWxBcnJheVswXSwgJ0FkYXB0YXRpb25TZXQnLCBjcmVhdGVBZGFwdGF0aW9uU2V0T2JqZWN0KSxcbiAgICAgICAgZ2V0UGVyaW9kOiB4bWxGdW4ucHJlQXBwbHlBcmdzRm4oZ2V0QW5jZXN0b3JPYmplY3RCeU5hbWUsIHhtbEFycmF5WzBdLCAnUGVyaW9kJywgY3JlYXRlUGVyaW9kT2JqZWN0KSxcbiAgICAgICAgZ2V0TXBkOiB4bWxGdW4ucHJlQXBwbHlBcmdzRm4oZ2V0QW5jZXN0b3JPYmplY3RCeU5hbWUsIHhtbEFycmF5WzBdLCAnTVBEJywgY3JlYXRlTXBkT2JqZWN0KSxcbiAgICAgICAgLy8gQXR0cnNcbiAgICAgICAgZ2V0SW5pdGlhbGl6YXRpb246IHhtbEZ1bi5wcmVBcHBseUFyZ3NGbihnZXRBdHRyRnJvbVhtbEFycmF5LCBnZXRJbml0aWFsaXphdGlvbiwgeG1sQXJyYXkpLFxuICAgICAgICBnZXRNZWRpYTogeG1sRnVuLnByZUFwcGx5QXJnc0ZuKGdldEF0dHJGcm9tWG1sQXJyYXksIGdldE1lZGlhLCB4bWxBcnJheSksXG4gICAgICAgIGdldER1cmF0aW9uOiB4bWxGdW4ucHJlQXBwbHlBcmdzRm4oZ2V0QXR0ckZyb21YbWxBcnJheSwgZ2V0RHVyYXRpb24sIHhtbEFycmF5KSxcbiAgICAgICAgZ2V0VGltZXNjYWxlOiB4bWxGdW4ucHJlQXBwbHlBcmdzRm4oZ2V0QXR0ckZyb21YbWxBcnJheSwgZ2V0VGltZXNjYWxlLCB4bWxBcnJheSksXG4gICAgICAgIGdldFByZXNlbnRhdGlvblRpbWVPZmZzZXQ6IHhtbEZ1bi5wcmVBcHBseUFyZ3NGbihnZXRBdHRyRnJvbVhtbEFycmF5LCBnZXRQcmVzZW50YXRpb25UaW1lT2Zmc2V0LCB4bWxBcnJheSksXG4gICAgICAgIGdldFN0YXJ0TnVtYmVyOiB4bWxGdW4ucHJlQXBwbHlBcmdzRm4oZ2V0QXR0ckZyb21YbWxBcnJheSwgZ2V0U3RhcnROdW1iZXIsIHhtbEFycmF5KVxuICAgIH07XG59O1xuXG4vLyBUT0RPOiBDaGFuZ2UgdGhpcyBhcGkgdG8gcmV0dXJuIGEgbGlzdCBvZiBhbGwgbWF0Y2hpbmcgYWRhcHRhdGlvbiBzZXRzIHRvIGFsbG93IGZvciBncmVhdGVyIGZsZXhpYmlsaXR5LlxuZ2V0QWRhcHRhdGlvblNldEJ5VHlwZSA9IGZ1bmN0aW9uKHR5cGUsIHBlcmlvZFhtbCkge1xuICAgIHZhciBhZGFwdGF0aW9uU2V0cyA9IHBlcmlvZFhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnQWRhcHRhdGlvblNldCcpLFxuICAgICAgICBhZGFwdGF0aW9uU2V0LFxuICAgICAgICByZXByZXNlbnRhdGlvbixcbiAgICAgICAgbWltZVR5cGU7XG5cbiAgICBmb3IgKHZhciBpPTA7IGk8YWRhcHRhdGlvblNldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYWRhcHRhdGlvblNldCA9IGFkYXB0YXRpb25TZXRzLml0ZW0oaSk7XG4gICAgICAgIC8vIFNpbmNlIHRoZSBtaW1lVHlwZSBjYW4gYmUgZGVmaW5lZCBvbiB0aGUgQWRhcHRhdGlvblNldCBvciBvbiBpdHMgUmVwcmVzZW50YXRpb24gY2hpbGQgbm9kZXMsXG4gICAgICAgIC8vIGNoZWNrIGZvciBtaW1ldHlwZSBvbiBvbmUgb2YgaXRzIFJlcHJlc2VudGF0aW9uIGNoaWxkcmVuIHVzaW5nIGdldE1pbWVUeXBlKCksIHdoaWNoIGFzc3VtZXMgdGhlXG4gICAgICAgIC8vIG1pbWVUeXBlIGNhbiBiZSBpbmhlcml0ZWQgYW5kIHdpbGwgY2hlY2sgaXRzZWxmIGFuZCBpdHMgYW5jZXN0b3JzIGZvciB0aGUgYXR0ci5cbiAgICAgICAgcmVwcmVzZW50YXRpb24gPSBhZGFwdGF0aW9uU2V0LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdSZXByZXNlbnRhdGlvbicpWzBdO1xuICAgICAgICAvLyBOZWVkIHRvIGNoZWNrIHRoZSByZXByZXNlbnRhdGlvbiBpbnN0ZWFkIG9mIHRoZSBhZGFwdGF0aW9uIHNldCwgc2luY2UgdGhlIG1pbWVUeXBlIG1heSBub3QgYmUgc3BlY2lmaWVkXG4gICAgICAgIC8vIG9uIHRoZSBhZGFwdGF0aW9uIHNldCBhdCBhbGwgYW5kIG1heSBiZSBzcGVjaWZpZWQgZm9yIGVhY2ggb2YgdGhlIHJlcHJlc2VudGF0aW9ucyBpbnN0ZWFkLlxuICAgICAgICBtaW1lVHlwZSA9IGdldE1pbWVUeXBlKHJlcHJlc2VudGF0aW9uKTtcbiAgICAgICAgaWYgKCEhbWltZVR5cGUgJiYgbWltZVR5cGUuaW5kZXhPZih0eXBlKSA+PSAwKSB7IHJldHVybiBjcmVhdGVBZGFwdGF0aW9uU2V0T2JqZWN0KGFkYXB0YXRpb25TZXQpOyB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG59O1xuXG5nZXRNcGQgPSBmdW5jdGlvbihtYW5pZmVzdFhtbCkge1xuICAgIHJldHVybiBnZXREZXNjZW5kYW50T2JqZWN0c0FycmF5QnlOYW1lKG1hbmlmZXN0WG1sLCAnTVBEJywgY3JlYXRlTXBkT2JqZWN0KVswXTtcbn07XG5cbi8vIFRPRE86IE1vdmUgdG8geG1sRnVuIG9yIG93biBtb2R1bGUuXG5nZXREZXNjZW5kYW50T2JqZWN0c0FycmF5QnlOYW1lID0gZnVuY3Rpb24ocGFyZW50WG1sLCB0YWdOYW1lLCBtYXBGbikge1xuICAgIHZhciBkZXNjZW5kYW50c1htbEFycmF5ID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwocGFyZW50WG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKHRhZ05hbWUpKTtcbiAgICAvKmlmICh0eXBlb2YgbWFwRm4gPT09ICdmdW5jdGlvbicpIHsgcmV0dXJuIGRlc2NlbmRhbnRzWG1sQXJyYXkubWFwKG1hcEZuKTsgfSovXG4gICAgaWYgKHR5cGVvZiBtYXBGbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YXIgbWFwcGVkRWxlbSA9IGRlc2NlbmRhbnRzWG1sQXJyYXkubWFwKG1hcEZuKTtcbiAgICAgICAgcmV0dXJuICBtYXBwZWRFbGVtO1xuICAgIH1cbiAgICByZXR1cm4gZGVzY2VuZGFudHNYbWxBcnJheTtcbn07XG5cbi8vIFRPRE86IE1vdmUgdG8geG1sRnVuIG9yIG93biBtb2R1bGUuXG5nZXRBbmNlc3Rvck9iamVjdEJ5TmFtZSA9IGZ1bmN0aW9uIGdldEFuY2VzdG9yT2JqZWN0QnlOYW1lKHhtbE5vZGUsIHRhZ05hbWUsIG1hcEZuKSB7XG4gICAgaWYgKCF0YWdOYW1lIHx8ICF4bWxOb2RlIHx8ICF4bWxOb2RlLnBhcmVudE5vZGUpIHsgcmV0dXJuIG51bGw7IH1cbiAgICBpZiAoIXhtbE5vZGUucGFyZW50Tm9kZS5ub2RlTmFtZSkgeyByZXR1cm4gbnVsbDsgfVxuXG4gICAgaWYgKHhtbE5vZGUucGFyZW50Tm9kZS5ub2RlTmFtZSA9PT0gdGFnTmFtZSkge1xuICAgICAgICByZXR1cm4gaXNGdW5jdGlvbihtYXBGbikgPyBtYXBGbih4bWxOb2RlLnBhcmVudE5vZGUpIDogeG1sTm9kZS5wYXJlbnROb2RlO1xuICAgIH1cbiAgICByZXR1cm4gZ2V0QW5jZXN0b3JPYmplY3RCeU5hbWUoeG1sTm9kZS5wYXJlbnROb2RlLCB0YWdOYW1lLCBtYXBGbik7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdldE1wZDsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBleGlzdHkgPSByZXF1aXJlKCcuLi8uLi91dGlsL2V4aXN0eS5qcycpLFxuICAgIGdldFhtbEZ1biA9IHJlcXVpcmUoJy4uLy4uL2dldFhtbEZ1bi5qcycpLFxuICAgIHhtbEZ1biA9IGdldFhtbEZ1bigpLFxuICAgIGdldERhc2hVdGlsID0gcmVxdWlyZSgnLi4vbXBkL2dldERhc2hVdGlsLmpzJyksXG4gICAgZGFzaFV0aWwgPSBnZXREYXNoVXRpbCgpLFxuICAgIHBhcnNlTWVkaWFQcmVzZW50YXRpb25EdXJhdGlvbiA9IGRhc2hVdGlsLnBhcnNlTWVkaWFQcmVzZW50YXRpb25EdXJhdGlvbixcbiAgICBwYXJzZURhdGVUaW1lID0gZGFzaFV0aWwucGFyc2VEYXRlVGltZSxcbiAgICBnZXRTZWdtZW50VGVtcGxhdGUgPSByZXF1aXJlKCcuL2dldFNlZ21lbnRUZW1wbGF0ZScpLFxuICAgIHNlZ21lbnRUZW1wbGF0ZSA9IGdldFNlZ21lbnRUZW1wbGF0ZSgpLFxuICAgIGNyZWF0ZVNlZ21lbnRMaXN0RnJvbVRlbXBsYXRlLFxuICAgIGNyZWF0ZVNlZ21lbnRGcm9tVGVtcGxhdGVCeU51bWJlcixcbiAgICBjcmVhdGVTZWdtZW50RnJvbVRlbXBsYXRlQnlUaW1lLFxuICAgIGNyZWF0ZVNlZ21lbnRGcm9tVGVtcGxhdGVCeVVUQ1dhbGxDbG9ja1RpbWUsXG4gICAgZ2V0VHlwZSxcbiAgICBnZXRJc0xpdmUsXG4gICAgZ2V0QmFuZHdpZHRoLFxuICAgIGdldFdpZHRoLFxuICAgIGdldEhlaWdodCxcbiAgICBnZXRUb3RhbER1cmF0aW9uRnJvbVRlbXBsYXRlLFxuICAgIGdldFVUQ1dhbGxDbG9ja1N0YXJ0VGltZUZyb21UZW1wbGF0ZSxcbiAgICBnZXRUaW1lU2hpZnRCdWZmZXJEZXB0aCxcbiAgICBnZXRTZWdtZW50RHVyYXRpb25Gcm9tVGVtcGxhdGUsXG4gICAgZ2V0VG90YWxTZWdtZW50Q291bnRGcm9tVGVtcGxhdGUsXG4gICAgZ2V0U3RhcnROdW1iZXJGcm9tVGVtcGxhdGUsXG4gICAgZ2V0RW5kTnVtYmVyRnJvbVRlbXBsYXRlO1xuXG5cbi8qKlxuICpcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gZ2V0IHRoZSAndHlwZScgb2YgYSBEQVNIIFJlcHJlc2VudGF0aW9uIGluIGEgZm9ybWF0IGV4cGVjdGVkIGJ5IHRoZSBNU0UgU291cmNlQnVmZmVyLiBVc2VkIHRvXG4gKiBjcmVhdGUgU291cmNlQnVmZmVyIGluc3RhbmNlcyB0aGF0IGNvcnJlc3BvbmQgdG8gYSBnaXZlbiBNZWRpYVNldCAoZS5nLiBzZXQgb2YgYXVkaW8gc3RyZWFtIHZhcmlhbnRzLCB2aWRlbyBzdHJlYW1cbiAqIHZhcmlhbnRzLCBldGMuKS5cbiAqXG4gKiBAcGFyYW0gcmVwcmVzZW50YXRpb24gICAgUE9KTyBEQVNIIE1QRCBSZXByZXNlbnRhdGlvblxuICogQHJldHVybnMge3N0cmluZ30gICAgICAgIFRoZSBSZXByZXNlbnRhdGlvbidzICd0eXBlJyBpbiBhIGZvcm1hdCBleHBlY3RlZCBieSB0aGUgTVNFIFNvdXJjZUJ1ZmZlclxuICovXG5nZXRUeXBlID0gZnVuY3Rpb24ocmVwcmVzZW50YXRpb24pIHtcbiAgICB2YXIgY29kZWNTdHIgPSByZXByZXNlbnRhdGlvbi5nZXRDb2RlY3MoKTtcbiAgICB2YXIgdHlwZVN0ciA9IHJlcHJlc2VudGF0aW9uLmdldE1pbWVUeXBlKCk7XG5cbiAgICAvL05PVEU6IExFQURJTkcgWkVST1MgSU4gQ09ERUMgVFlQRS9TVUJUWVBFIEFSRSBURUNITklDQUxMWSBOT1QgU1BFQyBDT01QTElBTlQsIEJVVCBHUEFDICYgT1RIRVJcbiAgICAvLyBEQVNIIE1QRCBHRU5FUkFUT1JTIFBST0RVQ0UgVEhFU0UgTk9OLUNPTVBMSUFOVCBWQUxVRVMuIEhBTkRMSU5HIEhFUkUgRk9SIE5PVy5cbiAgICAvLyBTZWU6IFJGQyA2MzgxIFNlYy4gMy40IChodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjNjM4MSNzZWN0aW9uLTMuNClcbiAgICB2YXIgcGFyc2VkQ29kZWMgPSBjb2RlY1N0ci5zcGxpdCgnLicpLm1hcChmdW5jdGlvbihzdHIpIHtcbiAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eMCsoPyFcXC58JCkvLCAnJyk7XG4gICAgfSk7XG4gICAgdmFyIHByb2Nlc3NlZENvZGVjU3RyID0gcGFyc2VkQ29kZWMuam9pbignLicpO1xuXG4gICAgcmV0dXJuICh0eXBlU3RyICsgJztjb2RlY3M9XCInICsgcHJvY2Vzc2VkQ29kZWNTdHIgKyAnXCInKTtcbn07XG5cbmdldElzTGl2ZSA9IGZ1bmN0aW9uKHJlcHJlc2VudGF0aW9uKSB7XG4gICAgcmV0dXJuIChyZXByZXNlbnRhdGlvbi5nZXRNcGQoKS5nZXRUeXBlKCkgPT09ICdkeW5hbWljJyk7XG59O1xuXG5nZXRCYW5kd2lkdGggPSBmdW5jdGlvbihyZXByZXNlbnRhdGlvbikge1xuICAgIHZhciBiYW5kd2lkdGggPSByZXByZXNlbnRhdGlvbi5nZXRCYW5kd2lkdGgoKTtcbiAgICByZXR1cm4gZXhpc3R5KGJhbmR3aWR0aCkgPyBOdW1iZXIoYmFuZHdpZHRoKSA6IHVuZGVmaW5lZDtcbn07XG5cbmdldFdpZHRoID0gZnVuY3Rpb24ocmVwcmVzZW50YXRpb24pIHtcbiAgICB2YXIgd2lkdGggPSByZXByZXNlbnRhdGlvbi5nZXRXaWR0aCgpO1xuICAgIHJldHVybiBleGlzdHkod2lkdGgpID8gTnVtYmVyKHdpZHRoKSA6IHVuZGVmaW5lZDtcbn07XG5cbmdldEhlaWdodCA9IGZ1bmN0aW9uKHJlcHJlc2VudGF0aW9uKSB7XG4gICAgdmFyIGhlaWdodCA9IHJlcHJlc2VudGF0aW9uLmdldEhlaWdodCgpO1xuICAgIHJldHVybiBleGlzdHkoaGVpZ2h0KSA/IE51bWJlcihoZWlnaHQpIDogdW5kZWZpbmVkO1xufTtcblxuZ2V0VG90YWxEdXJhdGlvbkZyb21UZW1wbGF0ZSA9IGZ1bmN0aW9uKHJlcHJlc2VudGF0aW9uKSB7XG4gICAgLy8gVE9ETzogU3VwcG9ydCBwZXJpb2QtcmVsYXRpdmUgcHJlc2VudGF0aW9uIHRpbWVcbiAgICB2YXIgbWVkaWFQcmVzZW50YXRpb25EdXJhdGlvbiA9IHJlcHJlc2VudGF0aW9uLmdldE1wZCgpLmdldE1lZGlhUHJlc2VudGF0aW9uRHVyYXRpb24oKSxcbiAgICAgICAgcGFyc2VkTWVkaWFQcmVzZW50YXRpb25EdXJhdGlvbiA9IGV4aXN0eShtZWRpYVByZXNlbnRhdGlvbkR1cmF0aW9uKSA/IHBhcnNlTWVkaWFQcmVzZW50YXRpb25EdXJhdGlvbihtZWRpYVByZXNlbnRhdGlvbkR1cmF0aW9uKSA6IE51bWJlci5OYU4sXG4gICAgICAgIHByZXNlbnRhdGlvblRpbWVPZmZzZXQgPSBOdW1iZXIocmVwcmVzZW50YXRpb24uZ2V0U2VnbWVudFRlbXBsYXRlKCkuZ2V0UHJlc2VudGF0aW9uVGltZU9mZnNldCgpKSB8fCAwO1xuICAgIHJldHVybiBleGlzdHkocGFyc2VkTWVkaWFQcmVzZW50YXRpb25EdXJhdGlvbikgPyBOdW1iZXIocGFyc2VkTWVkaWFQcmVzZW50YXRpb25EdXJhdGlvbiAtIHByZXNlbnRhdGlvblRpbWVPZmZzZXQpIDogTnVtYmVyLk5hTjtcbn07XG5cbmdldFVUQ1dhbGxDbG9ja1N0YXJ0VGltZUZyb21UZW1wbGF0ZSA9IGZ1bmN0aW9uKHJlcHJlc2VudGF0aW9uKSB7XG4gICAgdmFyIHdhbGxDbG9ja1RpbWVTdHIgPSByZXByZXNlbnRhdGlvbi5nZXRNcGQoKS5nZXRBdmFpbGFiaWxpdHlTdGFydFRpbWUoKSxcbiAgICAgICAgd2FsbENsb2NrVW5peFRpbWVVdGMgPSBwYXJzZURhdGVUaW1lKHdhbGxDbG9ja1RpbWVTdHIpO1xuICAgIHJldHVybiB3YWxsQ2xvY2tVbml4VGltZVV0Yztcbn07XG5cbmdldFRpbWVTaGlmdEJ1ZmZlckRlcHRoID0gZnVuY3Rpb24ocmVwcmVzZW50YXRpb24pIHtcbiAgICB2YXIgdGltZVNoaWZ0QnVmZmVyRGVwdGhTdHIgPSByZXByZXNlbnRhdGlvbi5nZXRNcGQoKS5nZXRUaW1lU2hpZnRCdWZmZXJEZXB0aCgpLFxuICAgICAgICBwYXJzZWRUaW1lU2hpZnRCdWZmZXJEZXB0aCA9IHBhcnNlTWVkaWFQcmVzZW50YXRpb25EdXJhdGlvbih0aW1lU2hpZnRCdWZmZXJEZXB0aFN0cik7XG4gICAgcmV0dXJuIHBhcnNlZFRpbWVTaGlmdEJ1ZmZlckRlcHRoO1xufTtcblxuZ2V0U2VnbWVudER1cmF0aW9uRnJvbVRlbXBsYXRlID0gZnVuY3Rpb24ocmVwcmVzZW50YXRpb24pIHtcbiAgICB2YXIgc2VnbWVudFRlbXBsYXRlID0gcmVwcmVzZW50YXRpb24uZ2V0U2VnbWVudFRlbXBsYXRlKCksXG4gICAgICAgIGR1cmF0aW9uID0gK3NlZ21lbnRUZW1wbGF0ZS5nZXREdXJhdGlvbigpLFxuICAgICAgICB0aW1lc2NhbGUgPSArc2VnbWVudFRlbXBsYXRlLmdldFRpbWVzY2FsZSgpLFxuICAgICAgICBzZWdtZW50cyxcbiAgICAgICAgZHVyYXRpb25zO1xuXG4gICAgaWYgKCFkdXJhdGlvbikge1xuICAgICAgICBzZWdtZW50cyA9IHNlZ21lbnRUZW1wbGF0ZS54bWxbMF0ucXVlcnlTZWxlY3RvckFsbCgnU1tkXScpO1xuICAgICAgICBkdXJhdGlvbnMgPSBBcnJheS5wcm90b3R5cGUubWFwLmNhbGwoc2VnbWVudHMsIGZ1bmN0aW9uKHNlZ21lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiArc2VnbWVudC5nZXRBdHRyaWJ1dGUoJ2QnKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGR1cmF0aW9uID0gTWF0aC5tYXguYXBwbHkobnVsbCwgZHVyYXRpb25zKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZHVyYXRpb24gLyB0aW1lc2NhbGU7XG59O1xuXG5nZXRUb3RhbFNlZ21lbnRDb3VudEZyb21UZW1wbGF0ZSA9IGZ1bmN0aW9uKHJlcHJlc2VudGF0aW9uKSB7XG4gICAgcmV0dXJuIE1hdGguY2VpbChnZXRUb3RhbER1cmF0aW9uRnJvbVRlbXBsYXRlKHJlcHJlc2VudGF0aW9uKSAvIGdldFNlZ21lbnREdXJhdGlvbkZyb21UZW1wbGF0ZShyZXByZXNlbnRhdGlvbikpO1xufTtcblxuZ2V0U3RhcnROdW1iZXJGcm9tVGVtcGxhdGUgPSBmdW5jdGlvbihyZXByZXNlbnRhdGlvbikge1xuICAgIHJldHVybiBOdW1iZXIocmVwcmVzZW50YXRpb24uZ2V0U2VnbWVudFRlbXBsYXRlKCkuZ2V0U3RhcnROdW1iZXIoKSk7XG59O1xuXG5nZXRFbmROdW1iZXJGcm9tVGVtcGxhdGUgPSBmdW5jdGlvbihyZXByZXNlbnRhdGlvbikge1xuICAgIHJldHVybiBnZXRUb3RhbFNlZ21lbnRDb3VudEZyb21UZW1wbGF0ZShyZXByZXNlbnRhdGlvbikgKyBnZXRTdGFydE51bWJlckZyb21UZW1wbGF0ZShyZXByZXNlbnRhdGlvbikgLSAxO1xufTtcblxuY3JlYXRlU2VnbWVudExpc3RGcm9tVGVtcGxhdGUgPSBmdW5jdGlvbihyZXByZXNlbnRhdGlvblhtbCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGdldFR5cGU6IHhtbEZ1bi5wcmVBcHBseUFyZ3NGbihnZXRUeXBlLCByZXByZXNlbnRhdGlvblhtbCksXG4gICAgICAgIGdldElzTGl2ZTogeG1sRnVuLnByZUFwcGx5QXJnc0ZuKGdldElzTGl2ZSwgcmVwcmVzZW50YXRpb25YbWwpLFxuICAgICAgICBnZXRCYW5kd2lkdGg6IHhtbEZ1bi5wcmVBcHBseUFyZ3NGbihnZXRCYW5kd2lkdGgsIHJlcHJlc2VudGF0aW9uWG1sKSxcbiAgICAgICAgZ2V0SGVpZ2h0OiB4bWxGdW4ucHJlQXBwbHlBcmdzRm4oZ2V0SGVpZ2h0LCByZXByZXNlbnRhdGlvblhtbCksXG4gICAgICAgIGdldFdpZHRoOiB4bWxGdW4ucHJlQXBwbHlBcmdzRm4oZ2V0V2lkdGgsIHJlcHJlc2VudGF0aW9uWG1sKSxcbiAgICAgICAgZ2V0VG90YWxEdXJhdGlvbjogeG1sRnVuLnByZUFwcGx5QXJnc0ZuKGdldFRvdGFsRHVyYXRpb25Gcm9tVGVtcGxhdGUsIHJlcHJlc2VudGF0aW9uWG1sKSxcbiAgICAgICAgZ2V0U2VnbWVudER1cmF0aW9uOiB4bWxGdW4ucHJlQXBwbHlBcmdzRm4oZ2V0U2VnbWVudER1cmF0aW9uRnJvbVRlbXBsYXRlLCByZXByZXNlbnRhdGlvblhtbCksXG4gICAgICAgIGdldFVUQ1dhbGxDbG9ja1N0YXJ0VGltZTogeG1sRnVuLnByZUFwcGx5QXJnc0ZuKGdldFVUQ1dhbGxDbG9ja1N0YXJ0VGltZUZyb21UZW1wbGF0ZSwgcmVwcmVzZW50YXRpb25YbWwpLFxuICAgICAgICBnZXRUaW1lU2hpZnRCdWZmZXJEZXB0aDogeG1sRnVuLnByZUFwcGx5QXJnc0ZuKGdldFRpbWVTaGlmdEJ1ZmZlckRlcHRoLCByZXByZXNlbnRhdGlvblhtbCksXG4gICAgICAgIGdldFRvdGFsU2VnbWVudENvdW50OiB4bWxGdW4ucHJlQXBwbHlBcmdzRm4oZ2V0VG90YWxTZWdtZW50Q291bnRGcm9tVGVtcGxhdGUsIHJlcHJlc2VudGF0aW9uWG1sKSxcbiAgICAgICAgZ2V0U3RhcnROdW1iZXI6IHhtbEZ1bi5wcmVBcHBseUFyZ3NGbihnZXRTdGFydE51bWJlckZyb21UZW1wbGF0ZSwgcmVwcmVzZW50YXRpb25YbWwpLFxuICAgICAgICBnZXRFbmROdW1iZXI6IHhtbEZ1bi5wcmVBcHBseUFyZ3NGbihnZXRFbmROdW1iZXJGcm9tVGVtcGxhdGUsIHJlcHJlc2VudGF0aW9uWG1sKSxcbiAgICAgICAgLy8gVE9ETzogRXh0ZXJuYWxpemVcbiAgICAgICAgZ2V0SW5pdGlhbGl6YXRpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGluaXRpYWxpemF0aW9uID0ge307XG4gICAgICAgICAgICBpbml0aWFsaXphdGlvbi5nZXRVcmwgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgYmFzZVVybCA9IHJlcHJlc2VudGF0aW9uWG1sLmdldEJhc2VVcmwoKSxcbiAgICAgICAgICAgICAgICAgICAgcmVwcmVzZW50YXRpb25JZCA9IHJlcHJlc2VudGF0aW9uWG1sLmdldElkKCksXG4gICAgICAgICAgICAgICAgICAgIGluaXRpYWxpemF0aW9uUmVsYXRpdmVVcmxUZW1wbGF0ZSA9IHJlcHJlc2VudGF0aW9uWG1sLmdldFNlZ21lbnRUZW1wbGF0ZSgpLmdldEluaXRpYWxpemF0aW9uKCksXG4gICAgICAgICAgICAgICAgICAgIGluaXRpYWxpemF0aW9uUmVsYXRpdmVVcmwgPSBzZWdtZW50VGVtcGxhdGUucmVwbGFjZUlERm9yVGVtcGxhdGUoaW5pdGlhbGl6YXRpb25SZWxhdGl2ZVVybFRlbXBsYXRlLCByZXByZXNlbnRhdGlvbklkKTtcblxuICAgICAgICAgICAgICAgIGluaXRpYWxpemF0aW9uUmVsYXRpdmVVcmwgPSBzZWdtZW50VGVtcGxhdGUucmVwbGFjZVRva2VuRm9yVGVtcGxhdGUoaW5pdGlhbGl6YXRpb25SZWxhdGl2ZVVybCwgJ0JhbmR3aWR0aCcsIHJlcHJlc2VudGF0aW9uWG1sLmdldEJhbmR3aWR0aCgpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2Jhc2VVcmwsIGluaXRpYWxpemF0aW9uUmVsYXRpdmVVcmxdLmpvaW4oJy8nKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gaW5pdGlhbGl6YXRpb247XG4gICAgICAgIH0sXG4gICAgICAgIGdldFNlZ21lbnRCeU51bWJlcjogZnVuY3Rpb24obnVtYmVyKSB7IHJldHVybiBjcmVhdGVTZWdtZW50RnJvbVRlbXBsYXRlQnlOdW1iZXIocmVwcmVzZW50YXRpb25YbWwsIG51bWJlcik7IH0sXG4gICAgICAgIGdldFNlZ21lbnRCeVRpbWU6IGZ1bmN0aW9uKHNlY29uZHMpIHsgcmV0dXJuIGNyZWF0ZVNlZ21lbnRGcm9tVGVtcGxhdGVCeVRpbWUocmVwcmVzZW50YXRpb25YbWwsIHNlY29uZHMpOyB9LFxuICAgICAgICBnZXRTZWdtZW50QnlVVENXYWxsQ2xvY2tUaW1lOiBmdW5jdGlvbih1dGNNaWxsaXNlY29uZHMpIHsgcmV0dXJuIGNyZWF0ZVNlZ21lbnRGcm9tVGVtcGxhdGVCeVVUQ1dhbGxDbG9ja1RpbWUocmVwcmVzZW50YXRpb25YbWwsIHV0Y01pbGxpc2Vjb25kcyk7IH1cbiAgICB9O1xufTtcblxuY3JlYXRlU2VnbWVudEZyb21UZW1wbGF0ZUJ5TnVtYmVyID0gZnVuY3Rpb24ocmVwcmVzZW50YXRpb24sIG51bWJlcikge1xuICAgIHZhciBzZWdtZW50ID0ge307XG4gICAgc2VnbWVudC5nZXRVcmwgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGJhc2VVcmwgPSByZXByZXNlbnRhdGlvbi5nZXRCYXNlVXJsKCksXG4gICAgICAgICAgICBzZWdtZW50UmVsYXRpdmVVcmxUZW1wbGF0ZSA9IHJlcHJlc2VudGF0aW9uLmdldFNlZ21lbnRUZW1wbGF0ZSgpLmdldE1lZGlhKCksXG4gICAgICAgICAgICByZXBsYWNlZElkVXJsID0gc2VnbWVudFRlbXBsYXRlLnJlcGxhY2VJREZvclRlbXBsYXRlKHNlZ21lbnRSZWxhdGl2ZVVybFRlbXBsYXRlLCByZXByZXNlbnRhdGlvbi5nZXRJZCgpKSxcbiAgICAgICAgICAgIHJlcGxhY2VkVG9rZW5zVXJsO1xuICAgICAgICAgICAgLy8gVE9ETzogU2luY2UgJFRpbWUkLXRlbXBsYXRlZCBzZWdtZW50IFVSTHMgc2hvdWxkIG9ubHkgZXhpc3QgaW4gY29uanVuY3Rpb24gdy9hIDxTZWdtZW50VGltZWxpbmU+LFxuICAgICAgICAgICAgLy8gVE9ETzogY2FuIGN1cnJlbnRseSBhc3N1bWUgYSAkTnVtYmVyJC1iYXNlZCB0ZW1wbGF0ZWQgdXJsLlxuICAgICAgICAgICAgLy8gVE9ETzogRW5mb3JjZSBtaW4vbWF4IG51bWJlciByYW5nZSAoYmFzZWQgb24gc2VnbWVudExpc3Qgc3RhcnROdW1iZXIgJiBlbmROdW1iZXIpXG4gICAgICAgIHJlcGxhY2VkVG9rZW5zVXJsID0gc2VnbWVudFRlbXBsYXRlLnJlcGxhY2VUb2tlbkZvclRlbXBsYXRlKHJlcGxhY2VkSWRVcmwsICdOdW1iZXInLCBudW1iZXIpO1xuICAgICAgICByZXBsYWNlZFRva2Vuc1VybCA9IHNlZ21lbnRUZW1wbGF0ZS5yZXBsYWNlVG9rZW5Gb3JUZW1wbGF0ZShyZXBsYWNlZFRva2Vuc1VybCwgJ0JhbmR3aWR0aCcsIHJlcHJlc2VudGF0aW9uLmdldEJhbmR3aWR0aCgpKTtcblxuICAgICAgcmV0dXJuIFtiYXNlVXJsLCByZXBsYWNlZFRva2Vuc1VybF0uam9pbignLycpO1xuICAgIH07XG4gICAgc2VnbWVudC5nZXRTdGFydFRpbWUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIChudW1iZXIgLSBnZXRTdGFydE51bWJlckZyb21UZW1wbGF0ZShyZXByZXNlbnRhdGlvbikpICogZ2V0U2VnbWVudER1cmF0aW9uRnJvbVRlbXBsYXRlKHJlcHJlc2VudGF0aW9uKTtcbiAgICB9O1xuICAgIHNlZ21lbnQuZ2V0VVRDV2FsbENsb2NrU3RhcnRUaW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBnZXRVVENXYWxsQ2xvY2tTdGFydFRpbWVGcm9tVGVtcGxhdGUocmVwcmVzZW50YXRpb24pICsgTWF0aC5yb3VuZCgoKG51bWJlciAtIGdldFN0YXJ0TnVtYmVyRnJvbVRlbXBsYXRlKHJlcHJlc2VudGF0aW9uKSkgKiBnZXRTZWdtZW50RHVyYXRpb25Gcm9tVGVtcGxhdGUocmVwcmVzZW50YXRpb24pKSAqIDEwMDApO1xuICAgIH07XG4gICAgc2VnbWVudC5nZXREdXJhdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBUT0RPOiBWZXJpZnlcbiAgICAgICAgdmFyIHN0YW5kYXJkU2VnbWVudER1cmF0aW9uID0gZ2V0U2VnbWVudER1cmF0aW9uRnJvbVRlbXBsYXRlKHJlcHJlc2VudGF0aW9uKSxcbiAgICAgICAgICAgIGR1cmF0aW9uLFxuICAgICAgICAgICAgbWVkaWFQcmVzZW50YXRpb25UaW1lLFxuICAgICAgICAgICAgcHJlY2lzaW9uTXVsdGlwbGllcjtcblxuICAgICAgICBpZiAoZ2V0RW5kTnVtYmVyRnJvbVRlbXBsYXRlKHJlcHJlc2VudGF0aW9uKSA9PT0gbnVtYmVyKSB7XG4gICAgICAgICAgICBtZWRpYVByZXNlbnRhdGlvblRpbWUgPSBOdW1iZXIoZ2V0VG90YWxEdXJhdGlvbkZyb21UZW1wbGF0ZShyZXByZXNlbnRhdGlvbikpO1xuICAgICAgICAgICAgLy8gSGFuZGxlIGZsb2F0aW5nIHBvaW50IHByZWNpc2lvbiBpc3N1ZVxuICAgICAgICAgICAgcHJlY2lzaW9uTXVsdGlwbGllciA9IDEwMDA7XG4gICAgICAgICAgICBkdXJhdGlvbiA9ICgoKG1lZGlhUHJlc2VudGF0aW9uVGltZSAqIHByZWNpc2lvbk11bHRpcGxpZXIpICUgKHN0YW5kYXJkU2VnbWVudER1cmF0aW9uICogcHJlY2lzaW9uTXVsdGlwbGllcikpIC8gcHJlY2lzaW9uTXVsdGlwbGllciApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZHVyYXRpb24gPSBzdGFuZGFyZFNlZ21lbnREdXJhdGlvbjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZHVyYXRpb247XG4gICAgfTtcbiAgICBzZWdtZW50LmdldE51bWJlciA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gbnVtYmVyOyB9O1xuICAgIHJldHVybiBzZWdtZW50O1xufTtcblxuY3JlYXRlU2VnbWVudEZyb21UZW1wbGF0ZUJ5VGltZSA9IGZ1bmN0aW9uKHJlcHJlc2VudGF0aW9uLCBzZWNvbmRzKSB7XG4gICAgdmFyIHNlZ21lbnREdXJhdGlvbiA9IGdldFNlZ21lbnREdXJhdGlvbkZyb21UZW1wbGF0ZShyZXByZXNlbnRhdGlvbiksXG4gICAgICAgIHN0YXJ0TnVtYmVyID0gZ2V0U3RhcnROdW1iZXJGcm9tVGVtcGxhdGUocmVwcmVzZW50YXRpb24pIHx8IDAsXG4gICAgICAgIG51bWJlciA9IE1hdGguZmxvb3Ioc2Vjb25kcyAvIHNlZ21lbnREdXJhdGlvbikgKyBzdGFydE51bWJlcixcbiAgICAgICAgc2VnbWVudCA9IGNyZWF0ZVNlZ21lbnRGcm9tVGVtcGxhdGVCeU51bWJlcihyZXByZXNlbnRhdGlvbiwgbnVtYmVyKTtcblxuICAgIC8vIElmIHdlJ3JlIHJlYWxseSBjbG9zZSB0byB0aGUgZW5kIHRpbWUgb2YgdGhlIGN1cnJlbnQgc2VnbWVudCAoc3RhcnQgdGltZSArIGR1cmF0aW9uKSxcbiAgICAvLyB0aGlzIG1lYW5zIHdlJ3JlIHJlYWxseSBjbG9zZSB0byB0aGUgc3RhcnQgdGltZSBvZiB0aGUgbmV4dCBzZWdtZW50LlxuICAgIC8vIFRoZXJlZm9yZSwgYXNzdW1lIHRoaXMgaXMgYSBmbG9hdGluZy1wb2ludCBwcmVjaXNpb24gaXNzdWUgd2hlcmUgd2Ugd2VyZSB0cnlpbmcgdG8gZ3JhYiBhIHNlZ21lbnRcbiAgICAvLyBieSBpdHMgc3RhcnQgdGltZSBhbmQgcmV0dXJuIHRoZSBuZXh0IHNlZ21lbnQgaW5zdGVhZC5cbiAgICBpZiAoKChzZWdtZW50LmdldFN0YXJ0VGltZSgpICsgc2VnbWVudC5nZXREdXJhdGlvbigpKSAtIHNlY29uZHMpIDw9IDAuMDAzICkge1xuICAgICAgICByZXR1cm4gY3JlYXRlU2VnbWVudEZyb21UZW1wbGF0ZUJ5TnVtYmVyKHJlcHJlc2VudGF0aW9uLCBudW1iZXIgKyAxKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2VnbWVudDtcbn07XG5cbmNyZWF0ZVNlZ21lbnRGcm9tVGVtcGxhdGVCeVVUQ1dhbGxDbG9ja1RpbWUgPSBmdW5jdGlvbihyZXByZXNlbnRhdGlvbiwgdW5peFRpbWVVdGNNaWxsaXNlY29uZHMpIHtcbiAgICB2YXIgd2FsbENsb2NrU3RhcnRUaW1lID0gZ2V0VVRDV2FsbENsb2NrU3RhcnRUaW1lRnJvbVRlbXBsYXRlKHJlcHJlc2VudGF0aW9uKSxcbiAgICAgICAgcHJlc2VudGF0aW9uVGltZTtcbiAgICBpZiAoaXNOYU4od2FsbENsb2NrU3RhcnRUaW1lKSkgeyByZXR1cm4gbnVsbDsgfVxuICAgIHByZXNlbnRhdGlvblRpbWUgPSAodW5peFRpbWVVdGNNaWxsaXNlY29uZHMgLSB3YWxsQ2xvY2tTdGFydFRpbWUpLzEwMDA7XG4gICAgaWYgKGlzTmFOKHByZXNlbnRhdGlvblRpbWUpKSB7IHJldHVybiBudWxsOyB9XG4gICAgcmV0dXJuIGNyZWF0ZVNlZ21lbnRGcm9tVGVtcGxhdGVCeVRpbWUocmVwcmVzZW50YXRpb24sIHByZXNlbnRhdGlvblRpbWUpO1xufTtcblxuZnVuY3Rpb24gZ2V0U2VnbWVudExpc3RGb3JSZXByZXNlbnRhdGlvbihyZXByZXNlbnRhdGlvbikge1xuICAgIGlmICghcmVwcmVzZW50YXRpb24pIHsgcmV0dXJuIHVuZGVmaW5lZDsgfVxuICAgIGlmIChyZXByZXNlbnRhdGlvbi5nZXRTZWdtZW50VGVtcGxhdGUoKSkgeyByZXR1cm4gY3JlYXRlU2VnbWVudExpc3RGcm9tVGVtcGxhdGUocmVwcmVzZW50YXRpb24pOyB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRTZWdtZW50TGlzdEZvclJlcHJlc2VudGF0aW9uO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2VnbWVudFRlbXBsYXRlLFxuICAgIHplcm9QYWRUb0xlbmd0aCxcbiAgICByZXBsYWNlVG9rZW5Gb3JUZW1wbGF0ZSxcbiAgICB1bmVzY2FwZURvbGxhcnNJblRlbXBsYXRlLFxuICAgIHJlcGxhY2VJREZvclRlbXBsYXRlO1xuXG56ZXJvUGFkVG9MZW5ndGggPSBmdW5jdGlvbiAobnVtU3RyLCBtaW5TdHJMZW5ndGgpIHtcbiAgICB3aGlsZSAobnVtU3RyLmxlbmd0aCA8IG1pblN0ckxlbmd0aCkge1xuICAgICAgICBudW1TdHIgPSAnMCcgKyBudW1TdHI7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bVN0cjtcbn07XG5cbnJlcGxhY2VUb2tlbkZvclRlbXBsYXRlID0gZnVuY3Rpb24gKHRlbXBsYXRlU3RyLCB0b2tlbiwgdmFsdWUpIHtcblxuICAgIHZhciBzdGFydFBvcyA9IDAsXG4gICAgICAgIGVuZFBvcyA9IDAsXG4gICAgICAgIHRva2VuTGVuID0gdG9rZW4ubGVuZ3RoLFxuICAgICAgICBmb3JtYXRUYWcgPSAnJTAnLFxuICAgICAgICBmb3JtYXRUYWdMZW4gPSBmb3JtYXRUYWcubGVuZ3RoLFxuICAgICAgICBmb3JtYXRUYWdQb3MsXG4gICAgICAgIHNwZWNpZmllcixcbiAgICAgICAgd2lkdGgsXG4gICAgICAgIHBhZGRlZFZhbHVlO1xuXG4gICAgLy8ga2VlcCBsb29waW5nIHJvdW5kIHVudGlsIGFsbCBpbnN0YW5jZXMgb2YgPHRva2VuPiBoYXZlIGJlZW5cbiAgICAvLyByZXBsYWNlZC4gb25jZSB0aGF0IGhhcyBoYXBwZW5lZCwgc3RhcnRQb3MgYmVsb3cgd2lsbCBiZSAtMVxuICAgIC8vIGFuZCB0aGUgY29tcGxldGVkIHVybCB3aWxsIGJlIHJldHVybmVkLlxuICAgIHdoaWxlICh0cnVlKSB7XG5cbiAgICAgICAgLy8gY2hlY2sgaWYgdGhlcmUgaXMgYSB2YWxpZCAkPHRva2VuPi4uLiQgaWRlbnRpZmllclxuICAgICAgICAvLyBpZiBub3QsIHJldHVybiB0aGUgdXJsIGFzIGlzLlxuICAgICAgICBzdGFydFBvcyA9IHRlbXBsYXRlU3RyLmluZGV4T2YoJyQnICsgdG9rZW4pO1xuICAgICAgICBpZiAoc3RhcnRQb3MgPCAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGVTdHI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0aGUgbmV4dCAnJCcgbXVzdCBiZSB0aGUgZW5kIG9mIHRoZSBpZGVudGlmZXJcbiAgICAgICAgLy8gaWYgdGhlcmUgaXNuJ3Qgb25lLCByZXR1cm4gdGhlIHVybCBhcyBpcy5cbiAgICAgICAgZW5kUG9zID0gdGVtcGxhdGVTdHIuaW5kZXhPZignJCcsIHN0YXJ0UG9zICsgdG9rZW5MZW4pO1xuICAgICAgICBpZiAoZW5kUG9zIDwgMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlU3RyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbm93IHNlZSBpZiB0aGVyZSBpcyBhbiBhZGRpdGlvbmFsIGZvcm1hdCB0YWcgc3VmZml4ZWQgdG9cbiAgICAgICAgLy8gdGhlIGlkZW50aWZpZXIgd2l0aGluIHRoZSBlbmNsb3NpbmcgJyQnIGNoYXJhY3RlcnNcbiAgICAgICAgZm9ybWF0VGFnUG9zID0gdGVtcGxhdGVTdHIuaW5kZXhPZihmb3JtYXRUYWcsIHN0YXJ0UG9zICsgdG9rZW5MZW4pO1xuICAgICAgICBpZiAoZm9ybWF0VGFnUG9zID4gc3RhcnRQb3MgJiYgZm9ybWF0VGFnUG9zIDwgZW5kUG9zKSB7XG5cbiAgICAgICAgICAgIHNwZWNpZmllciA9IHRlbXBsYXRlU3RyLmNoYXJBdChlbmRQb3MgLSAxKTtcbiAgICAgICAgICAgIHdpZHRoID0gcGFyc2VJbnQodGVtcGxhdGVTdHIuc3Vic3RyaW5nKGZvcm1hdFRhZ1BvcyArIGZvcm1hdFRhZ0xlbiwgZW5kUG9zIC0gMSksIDEwKTtcblxuICAgICAgICAgICAgLy8gc3VwcG9ydCB0aGUgbWluaW11bSBzcGVjaWZpZXJzIHJlcXVpcmVkIGJ5IElFRUUgMTAwMy4xXG4gICAgICAgICAgICAvLyAoZCwgaSAsIG8sIHUsIHgsIGFuZCBYKSBmb3IgY29tcGxldGVuZXNzXG4gICAgICAgICAgICBzd2l0Y2ggKHNwZWNpZmllcikge1xuICAgICAgICAgICAgICAgIC8vIHRyZWF0IGFsbCBpbnQgdHlwZXMgYXMgdWludCxcbiAgICAgICAgICAgICAgICAvLyBoZW5jZSBkZWxpYmVyYXRlIGZhbGx0aHJvdWdoXG4gICAgICAgICAgICAgICAgY2FzZSAnZCc6XG4gICAgICAgICAgICAgICAgY2FzZSAnaSc6XG4gICAgICAgICAgICAgICAgY2FzZSAndSc6XG4gICAgICAgICAgICAgICAgICAgIHBhZGRlZFZhbHVlID0gemVyb1BhZFRvTGVuZ3RoKHZhbHVlLnRvU3RyaW5nKCksIHdpZHRoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAneCc6XG4gICAgICAgICAgICAgICAgICAgIHBhZGRlZFZhbHVlID0gemVyb1BhZFRvTGVuZ3RoKHZhbHVlLnRvU3RyaW5nKDE2KSwgd2lkdGgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdYJzpcbiAgICAgICAgICAgICAgICAgICAgcGFkZGVkVmFsdWUgPSB6ZXJvUGFkVG9MZW5ndGgodmFsdWUudG9TdHJpbmcoMTYpLCB3aWR0aCkudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnbyc6XG4gICAgICAgICAgICAgICAgICAgIHBhZGRlZFZhbHVlID0gemVyb1BhZFRvTGVuZ3RoKHZhbHVlLnRvU3RyaW5nKDgpLCB3aWR0aCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdVbnN1cHBvcnRlZC9pbnZhbGlkIElFRUUgMTAwMy4xIGZvcm1hdCBpZGVudGlmaWVyIHN0cmluZyBpbiBVUkwnKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlU3RyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGFkZGVkVmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRlbXBsYXRlU3RyID0gdGVtcGxhdGVTdHIuc3Vic3RyaW5nKDAsIHN0YXJ0UG9zKSArIHBhZGRlZFZhbHVlICsgdGVtcGxhdGVTdHIuc3Vic3RyaW5nKGVuZFBvcyArIDEpO1xuICAgIH1cbn07XG5cbnVuZXNjYXBlRG9sbGFyc0luVGVtcGxhdGUgPSBmdW5jdGlvbiAodGVtcGxhdGVTdHIpIHtcbiAgICByZXR1cm4gdGVtcGxhdGVTdHIuc3BsaXQoJyQkJykuam9pbignJCcpO1xufTtcblxucmVwbGFjZUlERm9yVGVtcGxhdGUgPSBmdW5jdGlvbiAodGVtcGxhdGVTdHIsIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHRlbXBsYXRlU3RyLmluZGV4T2YoJyRSZXByZXNlbnRhdGlvbklEJCcpID09PSAtMSkgeyByZXR1cm4gdGVtcGxhdGVTdHI7IH1cbiAgICB2YXIgdiA9IHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgcmV0dXJuIHRlbXBsYXRlU3RyLnNwbGl0KCckUmVwcmVzZW50YXRpb25JRCQnKS5qb2luKHYpO1xufTtcblxuc2VnbWVudFRlbXBsYXRlID0ge1xuICAgIHplcm9QYWRUb0xlbmd0aDogemVyb1BhZFRvTGVuZ3RoLFxuICAgIHJlcGxhY2VUb2tlbkZvclRlbXBsYXRlOiByZXBsYWNlVG9rZW5Gb3JUZW1wbGF0ZSxcbiAgICB1bmVzY2FwZURvbGxhcnNJblRlbXBsYXRlOiB1bmVzY2FwZURvbGxhcnNJblRlbXBsYXRlLFxuICAgIHJlcGxhY2VJREZvclRlbXBsYXRlOiByZXBsYWNlSURGb3JUZW1wbGF0ZVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnZXRTZWdtZW50VGVtcGxhdGUoKSB7IHJldHVybiBzZWdtZW50VGVtcGxhdGU7IH07IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdmlkZW9qcyA9IHJlcXVpcmUoJ2dsb2JhbC93aW5kb3cnKS52aWRlb2pzLFxuICAgIE1lZGlhS2V5cyxcbiAgICBNZWRpYUtleVNlc3Npb24sXG5cbiAgICAvLyB3aWRldmluZSBpcyB0aGUgb25seSBpbXBsZW1lbnRlZCBDRE0gaW4gRU1FIHYwLjFiXG4gICAgLy8gZnV0dXJlIEVNRSByZWNvbW1lbmRzIGtleSBzeXN0ZW1zIGFyZSBzcGVjaWZpZWQgYWhlYWQgb2ZcbiAgICAvLyBsb2FkaW5nIG1lZGlhXG4gICAgS0VZX1NZU1RFTSA9ICdjb20ud2lkZXZpbmUuYWxwaGEnO1xuXG4vLyAtLS0tLS0tLS1cbi8vIERlY3J5cHRlclxuLy8gLS0tLS0tLS0tXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gRGVjcnlwdGVyKHRlY2gpIHtcbiAgdmFyIHBsYXllciA9IHRlY2gucGxheWVyKCksXG4gICAgICB2aWRlbyA9ICB0ZWNoLmVsKCksXG4gICAgICByZXF1ZXN0S2V5LCBjcmVhdGVLZXlTZXNzaW9uLCBzZXNzaW9uO1xuXG4gIHJlcXVlc3RLZXkgPSBmdW5jdGlvbihldmVudCkge1xuICAgIGlmICghKGV2ZW50LmtleVN5c3RlbSA9PT0gJycgfHwgZXZlbnQua2V5U3lzdGVtID09PSBLRVlfU1lTVEVNKSB8fFxuICAgICAgICAhdmlkZW8uY2FuUGxheVR5cGUoJ3ZpZGVvL21wNCcsIEtFWV9TWVNURU0pKSB7XG4gICAgICByZXR1cm4gcGxheWVyLmVycm9yKHtcbiAgICAgICAgLy8gTWVkaWFFcnJvci5NRURJQV9FUlJfU1JDX05PVF9TVVBQT1JURURcbiAgICAgICAgLy8gdXNlIHRoZSBjb25zdGFudCB0byBhdm9pZCBjb25mbGljdHMgd2l0aCBtb25rZXktcGF0Y2hlcnNcbiAgICAgICAgY29kZTogNCxcbiAgICAgICAgbWVzc2FnZTogJ1Vuc3VwcG9ydGVkIGtleSBzeXN0ZW06IFwiJyArIGV2ZW50LmtleVN5c3RlbSArICdcIidcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIGNyZWF0ZSBhIHNlc3Npb24gdG8gdHJhY2sgZGF0YSByZWxhdGVkIHRvIHRoaXMgc2V0IG9mIENETVxuICAgIC8vIGludGVyYWN0aW9uc1xuICAgIHNlc3Npb24gPSBwbGF5ZXIubWVkaWFLZXlzKCkuY3JlYXRlU2Vzc2lvbigndGVtcG9yYXJ5JywgZXZlbnQpO1xuXG4gICAgLy8gUmVxdWVzdCBrZXlzIGZyb20gdGhlIENETS4gVGhlIGtleXMgYXJlIHNlbnQgdG8gdGhlIGxpY2Vuc2VcbiAgICAvLyBzZXJ2ZXIgdG8gdmFsaWRhdGUgdGhpcyBwbGF5ZXIncyBsaWNlbnNlIHJlcXVlc3QuXG4gICAgLy8gaHR0cHM6Ly93M2MuZ2l0aHViLmlvL2VuY3J5cHRlZC1tZWRpYS9pbml0ZGF0YS1mb3JtYXQtcmVnaXN0cnkuaHRtbFxuICAgIHNlc3Npb24uZ2VuZXJhdGVSZXF1ZXN0KCdjZW5jJywgZXZlbnQuaW5pdERhdGEpO1xuICB9O1xuXG4gIGNyZWF0ZUtleVNlc3Npb24gPSBmdW5jdGlvbihldmVudCkge1xuICAgIGlmICghZXZlbnQubWVzc2FnZSkge1xuICAgICAgcmV0dXJuIHBsYXllci5lcnJvcih7XG4gICAgICAgIC8vIE1lZGlhRXJyb3IuTUVESUFfRVJSX1NSQ19OT1RfU1VQUE9SVEVEXG4gICAgICAgIC8vIHVzZSB0aGUgY29uc3RhbnQgdG8gYXZvaWQgY29uZmxpY3RzIHdpdGggbW9ua2V5LXBhdGNoZXJzXG4gICAgICAgIGNvZGU6IDQsXG4gICAgICAgIG1lc3NhZ2U6ICdLZXkgcmVxdWVzdCBnZW5lcmF0ZWQgYW4gaW52YWxpZCByZXNwb25zZSdcbiAgICAgIH0pO1xuICAgIH1cbiAgICBwbGF5ZXIudHJpZ2dlcih7XG4gICAgICB0eXBlOiAnbWVkaWFrZXltZXNzYWdlJyxcbiAgICAgIG9yaWdpbmFsRXZlbnQ6IGV2ZW50LFxuICAgICAgbWVzc2FnZTogZXZlbnQubWVzc2FnZSxcbiAgICAgIG1lZGlhS2V5U2Vzc2lvbjogc2Vzc2lvblxuICAgIH0pO1xuICB9O1xuXG4gIC8vIHNldHVwIEVNRSB2MC4xYiBldmVudCBoYW5kbGVyc1xuICAvLyBzZWUgaHR0cHM6Ly9kdmNzLnczLm9yZy9oZy9odG1sLW1lZGlhL3Jhdy1maWxlL2VtZS12MC4xYi9lbmNyeXB0ZWQtbWVkaWEvZW5jcnlwdGVkLW1lZGlhLmh0bWxcbiAgaWYgKCdvbndlYmtpdG5lZWRrZXknIGluIHZpZGVvKSB7XG4gICAgdmlkZW8uYWRkRXZlbnRMaXN0ZW5lcignd2Via2l0bmVlZGtleScsIHJlcXVlc3RLZXkpO1xuICAgIHZpZGVvLmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmtpdGtleW1lc3NhZ2UnLCBjcmVhdGVLZXlTZXNzaW9uKTtcbiAgfSBlbHNlIGlmICgnb25uZWVka2V5JyBpbiB2aWRlbykge1xuICAgIHZpZGVvLmFkZEV2ZW50TGlzdGVuZXIoJ25lZWRrZXknLCByZXF1ZXN0S2V5KTtcbiAgICB2aWRlby5hZGRFdmVudExpc3RlbmVyKCdrZXltZXNzYWdlJywgY3JlYXRlS2V5U2Vzc2lvbik7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdObyBjb21wYXRpYmxlIGNvbnRlbnQgcHJvdGVjdGlvbiBzeXN0ZW0gZGV0ZWN0ZWQnKTtcbiAgfVxufTtcblxuLy8gLS0tLS0tLS0tLS0tLVxuLy8gRU1FIEVtdWxhdGlvblxuLy8gLS0tLS0tLS0tLS0tLVxuXG4vKipcbiAqIFRoZSBNZWRpYUtleXMgb2JqZWN0IHJlcHJlc2VudHMgYSBzZXQgb2Yga2V5cyB0aGF0IGFuIGFzc29jaWF0ZWRcbiAqIEhUTUxNZWRpYUVsZW1lbnQgY2FuIHVzZSBmb3IgZGVjcnlwdGlvbiBvZiBtZWRpYSBkYXRhIGR1cmluZ1xuICogcGxheWJhY2suIEl0IGFsc28gcmVwcmVzZW50cyBhIENETSBpbnN0YW5jZS5cbiAqIGh0dHBzOi8vdzNjLmdpdGh1Yi5pby9lbmNyeXB0ZWQtbWVkaWEvI2lkbC1kZWYtTWVkaWFLZXlzXG4gKi9cbk1lZGlhS2V5cyA9IGZ1bmN0aW9uIE1lZGlhS2V5cyhwbGF5ZXIpIHtcbiAgdGhpcy5hY3RpdmVNZWRpYUtleVNlc3Npb25zXyA9IFtdO1xuICB0aGlzLnBsYXllcl8gPSBwbGF5ZXI7XG59O1xuTWVkaWFLZXlzLnByb3RvdHlwZSA9IG5ldyB2aWRlb2pzLkV2ZW50RW1pdHRlcigpO1xuTWVkaWFLZXlzLnByb3RvdHlwZS5hY3RpdmVNZWRpYUtleVNlc3Npb25zID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmFjdGl2ZU1lZGlhS2V5U2Vzc2lvbnNfO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgbmV3IE1lZGlhS2V5U2Vzc2lvbiBvYmplY3QuXG4gKiBAcGFyYW0gdHlwZSB7c3RyaW5nfVxuICogQHNlZSBodHRwczovL3czYy5naXRodWIuaW8vZW5jcnlwdGVkLW1lZGlhLyN3aWRsLU1lZGlhS2V5cy1jcmVhdGVTZXNzaW9uLU1lZGlhS2V5U2Vzc2lvbi1NZWRpYUtleVNlc3Npb25UeXBlLXNlc3Npb25UeXBlXG4gKi9cbk1lZGlhS2V5cy5wcm90b3R5cGUuY3JlYXRlU2Vzc2lvbiA9IGZ1bmN0aW9uKHR5cGUsIG9wdGlvbnMpIHtcbiAgdmFyIHZpZGVvID0gdGhpcy5wbGF5ZXJfLmVsKCkucXVlcnlTZWxlY3RvcignLnZqcy10ZWNoJyksXG4gICAgICBrZXlTZXNzaW9uID0gbmV3IE1lZGlhS2V5U2Vzc2lvbih2aWRlbywgb3B0aW9ucyk7XG4gIHRoaXMuYWN0aXZlTWVkaWFLZXlTZXNzaW9ucygpLnB1c2goa2V5U2Vzc2lvbik7XG4gIHJldHVybiBrZXlTZXNzaW9uO1xufTtcblxuLyoqXG4gKiBBIE1lZGlhIEtleSBTZXNzaW9uLCBvciBzaW1wbHkgU2Vzc2lvbiwgcHJvdmlkZXMgYSBjb250ZXh0IGZvclxuICogbWVzc2FnZSBleGNoYW5nZSB3aXRoIHRoZSBDRE0gYXMgYSByZXN1bHQgb2Ygd2hpY2gga2V5KHMpIGFyZSBtYWRlXG4gKiBhdmFpbGFibGUgdG8gdGhlIENETS4gU2Vzc2lvbnMgYXJlIGVtYm9kaWVkIGFzIE1lZGlhS2V5U2Vzc2lvblxuICogb2JqZWN0cy4gRWFjaCBLZXkgc2Vzc2lvbiBpcyBhc3NvY2lhdGVkIHdpdGggYSBzaW5nbGUgaW5zdGFuY2Ugb2ZcbiAqIEluaXRpYWxpemF0aW9uIERhdGEgcHJvdmlkZWQgaW4gdGhlIGdlbmVyYXRlUmVxdWVzdCgpIGNhbGwuXG4gKiBAc2VlIGh0dHBzOi8vdzNjLmdpdGh1Yi5pby9lbmNyeXB0ZWQtbWVkaWEvI2lkbC1kZWYtTWVkaWFLZXlTZXNzaW9uXG4gKi9cbk1lZGlhS2V5U2Vzc2lvbiA9IGZ1bmN0aW9uIE1lZGlhS2V5U2Vzc2lvbih2aWRlbywgb3B0aW9ucykge1xuICB0aGlzLnZpZGVvXyA9IHZpZGVvO1xuICB0aGlzLnNlc3Npb25JZF8gPSBvcHRpb25zLnNlc3Npb25JZDtcbn07XG5NZWRpYUtleVNlc3Npb24ucHJvdG90eXBlID0gbmV3IHZpZGVvanMuRXZlbnRFbWl0dGVyKCk7XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgcmVxdWVzdCBiYXNlZCBvbiB0aGUgaW5pdERhdGEuXG4gKiBAcGFyYW0gaW5pdERhdGFUeXBlIHtzdHJpbmd9IGEgc3RyaW5nIHRoYXQgaW5kaWNhdGVzIHdoYXQgZm9ybWF0XG4gKiB0aGUgaW5pdGlhbGl6YXRpb24gZGF0YSBpcyBwcm92aWRlZCBpbi5cbiAqIEBwYXJhbSBpbml0RGF0YSB7QnVmZmVyU291cmNlfSBhIGJsb2NrIG9mIGluaXRpYWxpemF0aW9uIGRhdGFcbiAqIGNvbnRhaW5pbmcgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHN0cmVhbSB0byBiZSBkZWNyeXB0ZWRcbiAqIEBzZWUgaHR0cHM6Ly93M2MuZ2l0aHViLmlvL2VuY3J5cHRlZC1tZWRpYS8jd2lkbC1NZWRpYUtleVNlc3Npb24tZ2VuZXJhdGVSZXF1ZXN0LVByb21pc2Utdm9pZC0tRE9NU3RyaW5nLWluaXREYXRhVHlwZS1CdWZmZXJTb3VyY2UtaW5pdERhdGFcbiAqL1xuTWVkaWFLZXlTZXNzaW9uLnByb3RvdHlwZS5nZW5lcmF0ZVJlcXVlc3QgPSBmdW5jdGlvbihpbml0RGF0YVR5cGUsIGluaXREYXRhKSB7XG4gIC8vIGV4cG9zZSBzZXNzaW9uSWQsIHN0ZXAgOS45XG4gIHRoaXMuc2Vzc2lvbklkID0gdGhpcy5zZXNzaW9uSWRfO1xuICAvLyB0cmlnZ2VyIGEgbWVzc2FnZSBldmVudCwgc3RlcCA5LjExXG4gIHRoaXMudmlkZW9fLndlYmtpdEdlbmVyYXRlS2V5UmVxdWVzdChLRVlfU1lTVEVNLCBpbml0RGF0YSk7XG59O1xuXG4vKipcbiAqIFByb3ZpZGVzIG1lc3NhZ2VzLCBpbmNsdWRpbmcgbGljZW5zZXMsIHRvIHRoZSBDRE0uXG4gKiBAcGFyYW0gcmVzcG9uc2Uge0J1ZmZlclNvdXJjZX0gQSBtZXNzYWdlIHRvIGJlIHByb3ZpZGVkIHRvIHRoZVxuICogQ0RNLiBUaGUgY29udGVudHMgYXJlIEtleSBTeXN0ZW0tc3BlY2lmaWMuIEl0IG11c3Qgbm90IGNvbnRhaW5cbiAqIGV4ZWN1dGFibGUgY29kZS5cbiAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gKiBAc2VlIGh0dHBzOi8vdzNjLmdpdGh1Yi5pby9lbmNyeXB0ZWQtbWVkaWEvI3dpZGwtTWVkaWFLZXlTZXNzaW9uLXVwZGF0ZS1Qcm9taXNlLXZvaWQtLUJ1ZmZlclNvdXJjZS1yZXNwb25zZVxuICovXG5NZWRpYUtleVNlc3Npb24ucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKGJ1ZmZlcikge1xuICB0aGlzLnZpZGVvXy53ZWJraXRBZGRLZXkoS0VZX1NZU1RFTSwgYnVmZmVyLCB0aGlzLnNlc3Npb25JZCk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLVxuLy8gUGxheWVyIEV4dGVuc2lvbnNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbi8qKlxuICogVGhlIE1lZGlhS2V5cyBiZWluZyB1c2VkIHdoZW4gZGVjcnlwdGluZyBlbmNyeXB0ZWQgbWVkaWEgZGF0YSBmb3JcbiAqIHRoaXMgbWVkaWEgZWxlbWVudC5cbiAqIEBzZWUgaHR0cHM6Ly93M2MuZ2l0aHViLmlvL2VuY3J5cHRlZC1tZWRpYS8jd2lkbC1IVE1MTWVkaWFFbGVtZW50LW1lZGlhS2V5c1xuICovXG52aWRlb2pzLlBsYXllci5wcm90b3R5cGUubWVkaWFLZXlzID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMubWVkaWFLZXlzXyA9IHRoaXMubWVkaWFLZXlzXyB8fCBuZXcgTWVkaWFLZXlzKHRoaXMpO1xuICByZXR1cm4gdGhpcy5tZWRpYUtleXNfO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGdldEV2ZW50TWdyID0gcmVxdWlyZSgnLi9nZXRFdmVudE1hbmFnZXIuanMnKSxcbiAgICBldmVudE1nciA9IGdldEV2ZW50TWdyKCksXG4gICAgZXZlbnREaXNwYXRjaGVyTWl4aW4gPSB7XG4gICAgICAgIHRyaWdnZXI6IGZ1bmN0aW9uKGV2ZW50T2JqZWN0KSB7IGV2ZW50TWdyLnRyaWdnZXIodGhpcywgZXZlbnRPYmplY3QpOyB9LFxuICAgICAgICBvbmU6IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyRm4pIHsgZXZlbnRNZ3Iub25lKHRoaXMsIHR5cGUsIGxpc3RlbmVyRm4pOyB9LFxuICAgICAgICBvbjogZnVuY3Rpb24odHlwZSwgbGlzdGVuZXJGbikgeyBldmVudE1nci5vbih0aGlzLCB0eXBlLCBsaXN0ZW5lckZuKTsgfSxcbiAgICAgICAgb2ZmOiBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lckZuKSB7IGV2ZW50TWdyLm9mZih0aGlzLCB0eXBlLCBsaXN0ZW5lckZuKTsgfVxuICAgIH07XG5cbm1vZHVsZS5leHBvcnRzID0gZXZlbnREaXNwYXRjaGVyTWl4aW47IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdmlkZW9qcyA9IHJlcXVpcmUoJ2dsb2JhbC93aW5kb3cnKS52aWRlb2pzLFxuICAgIGV2ZW50TWFuYWdlciA9IHtcbiAgICAgICAgdHJpZ2dlcjogdmlkZW9qcy50cmlnZ2VyLFxuICAgICAgICBvbmU6IHZpZGVvanMub25lLFxuICAgICAgICBvbjogdmlkZW9qcy5vbixcbiAgICAgICAgb2ZmOiB2aWRlb2pzLm9mZlxuICAgIH07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2V0RXZlbnRNYW5hZ2VyKCkgeyByZXR1cm4gZXZlbnRNYW5hZ2VyOyB9O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBUT0RPOiBSZWZhY3RvciB0byBzZXBhcmF0ZSBqcyBmaWxlcyAmIG1vZHVsZXMgJiByZW1vdmUgZnJvbSBoZXJlLlxuXG52YXIgZXhpc3R5ID0gcmVxdWlyZSgnLi91dGlsL2V4aXN0eS5qcycpLFxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCcuL3V0aWwvaXNGdW5jdGlvbi5qcycpLFxuICAgIGlzU3RyaW5nID0gcmVxdWlyZSgnLi91dGlsL2lzU3RyaW5nLmpzJyk7XG5cbi8vIE5PVEU6IFRoaXMgdmVyc2lvbiBvZiB0cnV0aHkgYWxsb3dzIG1vcmUgdmFsdWVzIHRvIGNvdW50XG4vLyBhcyBcInRydWVcIiB0aGFuIHN0YW5kYXJkIEpTIEJvb2xlYW4gb3BlcmF0b3IgY29tcGFyaXNvbnMuXG4vLyBTcGVjaWZpY2FsbHksIHRydXRoeSgpIHdpbGwgcmV0dXJuIHRydWUgZm9yIHRoZSB2YWx1ZXNcbi8vIDAsIFwiXCIsIGFuZCBOYU4sIHdoZXJlYXMgSlMgd291bGQgdHJlYXQgdGhlc2UgYXMgXCJmYWxzeVwiIHZhbHVlcy5cbmZ1bmN0aW9uIHRydXRoeSh4KSB7IHJldHVybiAoeCAhPT0gZmFsc2UpICYmIGV4aXN0eSh4KTsgfVxuXG5mdW5jdGlvbiBwcmVBcHBseUFyZ3NGbihmdW4gLyosIGFyZ3MgKi8pIHtcbiAgICB2YXIgcHJlQXBwbGllZEFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIC8vIE5PVEU6IHRoZSAqdGhpcyogcmVmZXJlbmNlIHdpbGwgcmVmZXIgdG8gdGhlIGNsb3N1cmUncyBjb250ZXh0IHVubGVzc1xuICAgIC8vIHRoZSByZXR1cm5lZCBmdW5jdGlvbiBpcyBpdHNlbGYgY2FsbGVkIHZpYSAuY2FsbCgpIG9yIC5hcHBseSgpLiBJZiB5b3VcbiAgICAvLyAqbmVlZCogdG8gcmVmZXIgdG8gaW5zdGFuY2UtbGV2ZWwgcHJvcGVydGllcywgZG8gc29tZXRoaW5nIGxpa2UgdGhlIGZvbGxvd2luZzpcbiAgICAvL1xuICAgIC8vIE15VHlwZS5wcm90b3R5cGUuc29tZUZuID0gZnVuY3Rpb24oYXJnQykgeyBwcmVBcHBseUFyZ3NGbihzb21lT3RoZXJGbiwgYXJnQSwgYXJnQiwgLi4uIGFyZ04pLmNhbGwodGhpcyk7IH07XG4gICAgLy9cbiAgICAvLyBPdGhlcndpc2UsIHlvdSBzaG91bGQgYmUgYWJsZSB0byBqdXN0IGNhbGw6XG4gICAgLy9cbiAgICAvLyBNeVR5cGUucHJvdG90eXBlLnNvbWVGbiA9IHByZUFwcGx5QXJnc0ZuKHNvbWVPdGhlckZuLCBhcmdBLCBhcmdCLCAuLi4gYXJnTik7XG4gICAgLy9cbiAgICAvLyBXaGVyZSBwb3NzaWJsZSwgZnVuY3Rpb25zIGFuZCBtZXRob2RzIHNob3VsZCBub3QgYmUgcmVhY2hpbmcgb3V0IHRvIGdsb2JhbCBzY29wZSBhbnl3YXksIHNvLi4uXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkgeyByZXR1cm4gZnVuLmFwcGx5KHRoaXMsIHByZUFwcGxpZWRBcmdzKTsgfTtcbn1cblxuLy8gSGlnaGVyLW9yZGVyIFhNTCBmdW5jdGlvbnNcblxuLy8gVGFrZXMgZnVuY3Rpb24ocykgYXMgYXJndW1lbnRzXG52YXIgZ2V0QW5jZXN0b3JzID0gZnVuY3Rpb24oZWxlbSwgc2hvdWxkU3RvcFByZWQpIHtcbiAgICB2YXIgYW5jZXN0b3JzID0gW107XG4gICAgaWYgKCFpc0Z1bmN0aW9uKHNob3VsZFN0b3BQcmVkKSkgeyBzaG91bGRTdG9wUHJlZCA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gZmFsc2U7IH07IH1cbiAgICAoZnVuY3Rpb24gZ2V0QW5jZXN0b3JzUmVjdXJzZShlbGVtKSB7XG4gICAgICAgIGlmIChzaG91bGRTdG9wUHJlZChlbGVtLCBhbmNlc3RvcnMpKSB7IHJldHVybjsgfVxuICAgICAgICBpZiAoZXhpc3R5KGVsZW0pICYmIGV4aXN0eShlbGVtLnBhcmVudE5vZGUpKSB7XG4gICAgICAgICAgICBhbmNlc3RvcnMucHVzaChlbGVtLnBhcmVudE5vZGUpO1xuICAgICAgICAgICAgZ2V0QW5jZXN0b3JzUmVjdXJzZShlbGVtLnBhcmVudE5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICB9KShlbGVtKTtcbiAgICByZXR1cm4gYW5jZXN0b3JzO1xufTtcblxuLy8gUmV0dXJucyBmdW5jdGlvblxudmFyIGdldE5vZGVMaXN0QnlOYW1lID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHJldHVybiBmdW5jdGlvbih4bWxPYmopIHtcbiAgICAgICAgcmV0dXJuIHhtbE9iai5nZXRFbGVtZW50c0J5VGFnTmFtZShuYW1lKTtcbiAgICB9O1xufTtcblxuLy8gUmV0dXJucyBmdW5jdGlvblxudmFyIGhhc01hdGNoaW5nQXR0cmlidXRlID0gZnVuY3Rpb24oYXR0ck5hbWUsIHZhbHVlKSB7XG4gICAgaWYgKCh0eXBlb2YgYXR0ck5hbWUgIT09ICdzdHJpbmcnKSB8fCBhdHRyTmFtZSA9PT0gJycpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfVxuICAgIHJldHVybiBmdW5jdGlvbihlbGVtKSB7XG4gICAgICAgIGlmICghZXhpc3R5KGVsZW0pIHx8ICFleGlzdHkoZWxlbS5oYXNBdHRyaWJ1dGUpIHx8ICFleGlzdHkoZWxlbS5nZXRBdHRyaWJ1dGUpKSB7IHJldHVybiBmYWxzZTsgfVxuICAgICAgICBpZiAoIWV4aXN0eSh2YWx1ZSkpIHsgcmV0dXJuIGVsZW0uaGFzQXR0cmlidXRlKGF0dHJOYW1lKTsgfVxuICAgICAgICByZXR1cm4gKGVsZW0uZ2V0QXR0cmlidXRlKGF0dHJOYW1lKSA9PT0gdmFsdWUpO1xuICAgIH07XG59O1xuXG4vLyBSZXR1cm5zIGZ1bmN0aW9uXG52YXIgZ2V0QXR0ckZuID0gZnVuY3Rpb24oYXR0ck5hbWUpIHtcbiAgICBpZiAoIWlzU3RyaW5nKGF0dHJOYW1lKSkgeyByZXR1cm4gdW5kZWZpbmVkOyB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGVsZW0pIHtcbiAgICAgICAgaWYgKCFleGlzdHkoZWxlbSkgfHwgIWlzRnVuY3Rpb24oZWxlbS5nZXRBdHRyaWJ1dGUpKSB7IHJldHVybiB1bmRlZmluZWQ7IH1cbiAgICAgICAgcmV0dXJuIGVsZW0uZ2V0QXR0cmlidXRlKGF0dHJOYW1lKTtcbiAgICB9O1xufTtcblxuLy8gUmV0dXJucyBmdW5jdGlvblxuLy8gVE9ETzogQWRkIHNob3VsZFN0b3BQcmVkIChzaG91bGQgZnVuY3Rpb24gc2ltaWxhcmx5IHRvIHNob3VsZFN0b3BQcmVkIGluIGdldEluaGVyaXRhYmxlRWxlbWVudCwgYmVsb3cpXG52YXIgZ2V0SW5oZXJpdGFibGVBdHRyaWJ1dGUgPSBmdW5jdGlvbihhdHRyTmFtZSkge1xuICAgIGlmICgoIWlzU3RyaW5nKGF0dHJOYW1lKSkgfHwgYXR0ck5hbWUgPT09ICcnKSB7IHJldHVybiB1bmRlZmluZWQ7IH1cbiAgICByZXR1cm4gZnVuY3Rpb24gcmVjdXJzZUNoZWNrQW5jZXN0b3JBdHRyKGVsZW0pIHtcbiAgICAgICAgaWYgKCFleGlzdHkoZWxlbSkgfHwgIWV4aXN0eShlbGVtLmhhc0F0dHJpYnV0ZSkgfHwgIWV4aXN0eShlbGVtLmdldEF0dHJpYnV0ZSkpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfVxuICAgICAgICBpZiAoZWxlbS5oYXNBdHRyaWJ1dGUoYXR0ck5hbWUpKSB7IHJldHVybiBlbGVtLmdldEF0dHJpYnV0ZShhdHRyTmFtZSk7IH1cbiAgICAgICAgaWYgKCFleGlzdHkoZWxlbS5wYXJlbnROb2RlKSkgeyByZXR1cm4gdW5kZWZpbmVkOyB9XG4gICAgICAgIHJldHVybiByZWN1cnNlQ2hlY2tBbmNlc3RvckF0dHIoZWxlbS5wYXJlbnROb2RlKTtcbiAgICB9O1xufTtcblxuLy8gVGFrZXMgZnVuY3Rpb24ocykgYXMgYXJndW1lbnRzOyBSZXR1cm5zIGZ1bmN0aW9uXG52YXIgZ2V0SW5oZXJpdGFibGVFbGVtZW50ID0gZnVuY3Rpb24obm9kZU5hbWUsIHNob3VsZFN0b3BQcmVkKSB7XG4gICAgaWYgKCghaXNTdHJpbmcobm9kZU5hbWUpKSB8fCBub2RlTmFtZSA9PT0gJycpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfVxuICAgIGlmICghaXNGdW5jdGlvbihzaG91bGRTdG9wUHJlZCkpIHsgc2hvdWxkU3RvcFByZWQgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGZhbHNlOyB9OyB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGdldEluaGVyaXRhYmxlRWxlbWVudFJlY3Vyc2UoZWxlbSkge1xuICAgICAgICBpZiAoIWV4aXN0eShlbGVtKSB8fCAhZXhpc3R5KGVsZW0uZ2V0RWxlbWVudHNCeVRhZ05hbWUpKSB7IHJldHVybiB1bmRlZmluZWQ7IH1cbiAgICAgICAgaWYgKHNob3VsZFN0b3BQcmVkKGVsZW0pKSB7IHJldHVybiB1bmRlZmluZWQ7IH1cbiAgICAgICAgdmFyIG1hdGNoaW5nRWxlbUxpc3QgPSBlbGVtLmdldEVsZW1lbnRzQnlUYWdOYW1lKG5vZGVOYW1lKTtcbiAgICAgICAgaWYgKGV4aXN0eShtYXRjaGluZ0VsZW1MaXN0KSAmJiBtYXRjaGluZ0VsZW1MaXN0Lmxlbmd0aCA+IDApIHsgcmV0dXJuIG1hdGNoaW5nRWxlbUxpc3RbMF07IH1cbiAgICAgICAgaWYgKCFleGlzdHkoZWxlbS5wYXJlbnROb2RlKSkgeyByZXR1cm4gdW5kZWZpbmVkOyB9XG4gICAgICAgIHJldHVybiBnZXRJbmhlcml0YWJsZUVsZW1lbnRSZWN1cnNlKGVsZW0ucGFyZW50Tm9kZSk7XG4gICAgfTtcbn07XG5cbnZhciBnZXRDaGlsZEVsZW1lbnRCeU5vZGVOYW1lID0gZnVuY3Rpb24obm9kZU5hbWUpIHtcbiAgICBpZiAoKCFpc1N0cmluZyhub2RlTmFtZSkpIHx8IG5vZGVOYW1lID09PSAnJykgeyByZXR1cm4gdW5kZWZpbmVkOyB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGVsZW0pIHtcbiAgICAgICAgaWYgKCFleGlzdHkoZWxlbSkgfHwgIWlzRnVuY3Rpb24oZWxlbS5nZXRFbGVtZW50c0J5VGFnTmFtZSkpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfVxuICAgICAgICB2YXIgaW5pdGlhbE1hdGNoZXMgPSBlbGVtLmdldEVsZW1lbnRzQnlUYWdOYW1lKG5vZGVOYW1lKSxcbiAgICAgICAgICAgIGN1cnJlbnRFbGVtO1xuICAgICAgICBpZiAoIWV4aXN0eShpbml0aWFsTWF0Y2hlcykgfHwgaW5pdGlhbE1hdGNoZXMubGVuZ3RoIDw9IDApIHsgcmV0dXJuIHVuZGVmaW5lZDsgfVxuICAgICAgICBjdXJyZW50RWxlbSA9IGluaXRpYWxNYXRjaGVzWzBdO1xuICAgICAgICByZXR1cm4gKGN1cnJlbnRFbGVtLnBhcmVudE5vZGUgPT09IGVsZW0pID8gY3VycmVudEVsZW0gOiB1bmRlZmluZWQ7XG4gICAgfTtcbn07XG5cbnZhciBnZXRNdWx0aUxldmVsRWxlbWVudExpc3QgPSBmdW5jdGlvbihub2RlTmFtZSwgc2hvdWxkU3RvcFByZWQpIHtcbiAgICBpZiAoKCFpc1N0cmluZyhub2RlTmFtZSkpIHx8IG5vZGVOYW1lID09PSAnJykgeyByZXR1cm4gdW5kZWZpbmVkOyB9XG4gICAgaWYgKCFpc0Z1bmN0aW9uKHNob3VsZFN0b3BQcmVkKSkgeyBzaG91bGRTdG9wUHJlZCA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gZmFsc2U7IH07IH1cbiAgICB2YXIgZ2V0TWF0Y2hpbmdDaGlsZE5vZGVGbiA9IGdldENoaWxkRWxlbWVudEJ5Tm9kZU5hbWUobm9kZU5hbWUpO1xuICAgIHJldHVybiBmdW5jdGlvbihlbGVtKSB7XG4gICAgICAgIHZhciBjdXJyZW50RWxlbSA9IGVsZW0sXG4gICAgICAgICAgICBtdWx0aUxldmVsRWxlbUxpc3QgPSBbXSxcbiAgICAgICAgICAgIG1hdGNoaW5nRWxlbTtcbiAgICAgICAgLy8gVE9ETzogUmVwbGFjZSB3L3JlY3Vyc2l2ZSBmbj9cbiAgICAgICAgd2hpbGUgKGV4aXN0eShjdXJyZW50RWxlbSkgJiYgIXNob3VsZFN0b3BQcmVkKGN1cnJlbnRFbGVtKSkge1xuICAgICAgICAgICAgbWF0Y2hpbmdFbGVtID0gZ2V0TWF0Y2hpbmdDaGlsZE5vZGVGbihjdXJyZW50RWxlbSk7XG4gICAgICAgICAgICBpZiAoZXhpc3R5KG1hdGNoaW5nRWxlbSkpIHsgbXVsdGlMZXZlbEVsZW1MaXN0LnB1c2gobWF0Y2hpbmdFbGVtKTsgfVxuICAgICAgICAgICAgY3VycmVudEVsZW0gPSBjdXJyZW50RWxlbS5wYXJlbnROb2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG11bHRpTGV2ZWxFbGVtTGlzdC5sZW5ndGggPiAwID8gbXVsdGlMZXZlbEVsZW1MaXN0IDogdW5kZWZpbmVkO1xuICAgIH07XG59O1xuXG4vLyBQdWJsaXNoIEV4dGVybmFsIEFQSTpcbnZhciB4bWxGdW4gPSB7fTtcbnhtbEZ1bi5leGlzdHkgPSBleGlzdHk7XG54bWxGdW4udHJ1dGh5ID0gdHJ1dGh5O1xuXG54bWxGdW4uZ2V0Tm9kZUxpc3RCeU5hbWUgPSBnZXROb2RlTGlzdEJ5TmFtZTtcbnhtbEZ1bi5oYXNNYXRjaGluZ0F0dHJpYnV0ZSA9IGhhc01hdGNoaW5nQXR0cmlidXRlO1xueG1sRnVuLmdldEluaGVyaXRhYmxlQXR0cmlidXRlID0gZ2V0SW5oZXJpdGFibGVBdHRyaWJ1dGU7XG54bWxGdW4uZ2V0QW5jZXN0b3JzID0gZ2V0QW5jZXN0b3JzO1xueG1sRnVuLmdldEF0dHJGbiA9IGdldEF0dHJGbjtcbnhtbEZ1bi5wcmVBcHBseUFyZ3NGbiA9IHByZUFwcGx5QXJnc0ZuO1xueG1sRnVuLmdldEluaGVyaXRhYmxlRWxlbWVudCA9IGdldEluaGVyaXRhYmxlRWxlbWVudDtcbnhtbEZ1bi5nZXRNdWx0aUxldmVsRWxlbWVudExpc3QgPSBnZXRNdWx0aUxldmVsRWxlbWVudExpc3Q7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2V0WG1sRnVuKCkgeyByZXR1cm4geG1sRnVuOyB9OyIsIi8qKlxuICpcbiAqIG1haW4gc291cmNlIGZvciBwYWNrYWdlZCBjb2RlLiBBdXRvLWJvb3RzdHJhcHMgdGhlIHNvdXJjZSBoYW5kbGluZyBmdW5jdGlvbmFsaXR5IGJ5IHJlZ2lzdGVyaW5nIHRoZSBzb3VyY2UgaGFuZGxlclxuICogd2l0aCB2aWRlby5qcyBvbiBpbml0aWFsIHNjcmlwdCBsb2FkIHZpYSBJSUZFLiAoTk9URTogVGhpcyBwbGFjZXMgYW4gb3JkZXIgZGVwZW5kZW5jeSBvbiB0aGUgdmlkZW8uanMgbGlicmFyeSwgd2hpY2hcbiAqIG11c3QgYWxyZWFkeSBiZSBsb2FkZWQgYmVmb3JlIHRoaXMgc2NyaXB0IGF1dG8tZXhlY3V0ZXMuKVxuICpcbiAqL1xuOyhmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgcm9vdCA9IHJlcXVpcmUoJ2dsb2JhbC93aW5kb3cnKSxcbiAgICAgICAgdmlkZW9qcyA9IHJvb3QudmlkZW9qcyxcbiAgICAgICAgU291cmNlSGFuZGxlciA9IHJlcXVpcmUoJy4vU291cmNlSGFuZGxlcicpLFxuICAgICAgICBDYW5IYW5kbGVTb3VyY2VFbnVtID0ge1xuICAgICAgICAgICAgRE9FU05UX0hBTkRMRV9TT1VSQ0U6ICcnLFxuICAgICAgICAgICAgTUFZQkVfSEFORExFX1NPVVJDRTogJ21heWJlJ1xuICAgICAgICB9O1xuXG4gICAgaWYgKCF2aWRlb2pzKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHZpZGVvLmpzIGxpYnJhcnkgbXVzdCBiZSBpbmNsdWRlZCB0byB1c2UgdGhpcyBNUEVHLURBU0ggc291cmNlIGhhbmRsZXIuJyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBVc2VkIGJ5IGEgdmlkZW8uanMgdGVjaCBpbnN0YW5jZSB0byB2ZXJpZnkgd2hldGhlciBvciBub3QgYSBzcGVjaWZpYyBtZWRpYSBzb3VyY2UgY2FuIGJlIGhhbmRsZWQgYnkgdGhpc1xuICAgICAqIHNvdXJjZSBoYW5kbGVyLiBJbiB0aGlzIGNhc2UsIHNob3VsZCByZXR1cm4gJ21heWJlJyBpZiB0aGUgc291cmNlIGlzIE1QRUctREFTSCwgb3RoZXJ3aXNlICcnIChyZXByZXNlbnRpbmcgbm8pLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHNvdXJjZSAgICAgICAgICAgdmlkZW8uanMgc291cmNlIG9iamVjdCBwcm92aWRpbmcgc291cmNlIHVyaSBhbmQgdHlwZSBpbmZvcm1hdGlvblxuICAgICAqIEByZXR1cm5zIHtDYW5IYW5kbGVTb3VyY2VFbnVtfSAgIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB3aGV0aGVyIG9yIG5vdCBwYXJ0aWN1bGFyIHNvdXJjZSBjYW4gYmUgaGFuZGxlZCBieSB0aGlzXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlIGhhbmRsZXIuXG4gICAgICovXG4gICAgZnVuY3Rpb24gY2FuSGFuZGxlU291cmNlKHNvdXJjZSkge1xuICAgICAgICAvLyBSZXF1aXJlcyBNZWRpYSBTb3VyY2UgRXh0ZW5zaW9uc1xuICAgICAgICBpZiAoIShyb290Lk1lZGlhU291cmNlKSkge1xuICAgICAgICAgICAgcmV0dXJuIENhbkhhbmRsZVNvdXJjZUVudW0uRE9FU05UX0hBTkRMRV9TT1VSQ0U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBpZiB0aGUgdHlwZSBpcyBzdXBwb3J0ZWRcbiAgICAgICAgaWYgKC9hcHBsaWNhdGlvblxcL2Rhc2hcXCt4bWwvLnRlc3Qoc291cmNlLnR5cGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gQ2FuSGFuZGxlU291cmNlRW51bS5NQVlCRV9IQU5ETEVfU09VUkNFO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIGZpbGUgZXh0ZW5zaW9uIG1hdGNoZXNcbiAgICAgICAgaWYgKC9cXC5tcGQkL2kudGVzdChzb3VyY2Uuc3JjKSkge1xuICAgICAgICAgICAgcmV0dXJuIENhbkhhbmRsZVNvdXJjZUVudW0uTUFZQkVfSEFORExFX1NPVVJDRTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBDYW5IYW5kbGVTb3VyY2VFbnVtLkRPRVNOVF9IQU5ETEVfU09VUkNFO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQ2FsbGVkIGJ5IGEgdmlkZW8uanMgdGVjaCBpbnN0YW5jZSB0byBoYW5kbGUgYSBzcGVjaWZpYyBtZWRpYSBzb3VyY2UsIHJldHVybmluZyBhbiBvYmplY3QgaW5zdGFuY2UgdGhhdCBwcm92aWRlc1xuICAgICAqIHRoZSBjb250ZXh0IGZvciBoYW5kbGluZyBzYWlkIHNvdXJjZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzb3VyY2UgICAgICAgICAgICB2aWRlby5qcyBzb3VyY2Ugb2JqZWN0IHByb3ZpZGluZyBzb3VyY2UgdXJpIGFuZCB0eXBlIGluZm9ybWF0aW9uXG4gICAgICogQHBhcmFtIHRlY2ggICAgICAgICAgICAgIHZpZGVvLmpzIHRlY2ggb2JqZWN0IChpbiB0aGlzIGNhc2UsIHNob3VsZCBiZSBIdG1sNSB0ZWNoKSBwcm92aWRpbmcgcG9pbnQgb2YgaW50ZXJhY3Rpb25cbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgYmV0d2VlbiB0aGUgc291cmNlIGhhbmRsZXIgYW5kIHRoZSB2aWRlby5qcyBsaWJyYXJ5IChpbmNsdWRpbmcsIGUuZy4sIHRoZSB2aWRlbyBlbGVtZW50KVxuICAgICAqIEByZXR1cm5zIHtTb3VyY2VIYW5kbGVyfSBBbiBvYmplY3QgdGhhdCBkZWZpbmVzIGNvbnRleHQgZm9yIGhhbmRsaW5nIGEgcGFydGljdWxhciBNUEVHLURBU0ggc291cmNlLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGhhbmRsZVNvdXJjZShzb3VyY2UsIHRlY2gpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTb3VyY2VIYW5kbGVyKHNvdXJjZSwgdGVjaCk7XG4gICAgfVxuXG4gICAgLy8gUmVnaXN0ZXIgdGhlIHNvdXJjZSBoYW5kbGVyIHRvIHRoZSBIdG1sNSB0ZWNoIGluc3RhbmNlLlxuICAgIHZpZGVvanMuSHRtbDUucmVnaXN0ZXJTb3VyY2VIYW5kbGVyKHtcbiAgICAgICAgY2FuSGFuZGxlU291cmNlOiBjYW5IYW5kbGVTb3VyY2UsXG4gICAgICAgIGhhbmRsZVNvdXJjZTogaGFuZGxlU291cmNlXG4gICAgfSwgMCk7XG5cbn0uY2FsbCh0aGlzKSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBleGlzdHkgPSByZXF1aXJlKCcuLi91dGlsL2V4aXN0eS5qcycpLFxuICAgIHRydXRoeSA9IHJlcXVpcmUoJy4uL3V0aWwvdHJ1dGh5LmpzJyksXG4gICAgaXNTdHJpbmcgPSByZXF1aXJlKCcuLi91dGlsL2lzU3RyaW5nLmpzJyksXG4gICAgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJy4uL3V0aWwvaXNGdW5jdGlvbi5qcycpLFxuICAgIGlzQXJyYXkgPSByZXF1aXJlKCcuLi91dGlsL2lzQXJyYXkuanMnKSxcbiAgICBmaW5kRWxlbWVudEluQXJyYXkgPSByZXF1aXJlKCcuLi91dGlsL2ZpbmRFbGVtZW50SW5BcnJheS5qcycpLFxuICAgIGdldE1lZGlhVHlwZUZyb21NaW1lVHlwZSA9IHJlcXVpcmUoJy4uL3V0aWwvZ2V0TWVkaWFUeXBlRnJvbU1pbWVUeXBlLmpzJyksXG4gICAgbG9hZE1hbmlmZXN0ID0gcmVxdWlyZSgnLi9sb2FkTWFuaWZlc3QuanMnKSxcbiAgICBleHRlbmRPYmplY3QgPSByZXF1aXJlKCcuLi91dGlsL2V4dGVuZE9iamVjdC5qcycpLFxuICAgIGdldERhc2hVdGlsID0gcmVxdWlyZSgnLi4vZGFzaC9tcGQvZ2V0RGFzaFV0aWwuanMnKSxcbiAgICBkYXNoVXRpbCA9IGdldERhc2hVdGlsKCksXG4gICAgcGFyc2VNZWRpYVByZXNlbnRhdGlvbkR1cmF0aW9uID0gZGFzaFV0aWwucGFyc2VNZWRpYVByZXNlbnRhdGlvbkR1cmF0aW9uLFxuICAgIEV2ZW50RGlzcGF0Y2hlck1peGluID0gcmVxdWlyZSgnLi4vZXZlbnRzL0V2ZW50RGlzcGF0Y2hlck1peGluLmpzJyksXG4gICAgZ2V0TXBkID0gcmVxdWlyZSgnLi4vZGFzaC9tcGQvZ2V0TXBkLmpzJyksXG4gICAgTWVkaWFTZXQgPSByZXF1aXJlKCcuLi9NZWRpYVNldC5qcycpLFxuICAgIG1lZGlhVHlwZXMgPSByZXF1aXJlKCcuL01lZGlhVHlwZXMuanMnKTtcblxuLyoqXG4gKlxuICogVGhlIE1hbmlmZXN0Q29udHJvbGxlciBsb2Fkcywgc3RvcmVzLCBhbmQgcHJvdmlkZXMgZGF0YSB2aWV3cyBmb3IgdGhlIE1QRCBtYW5pZmVzdCB0aGF0IHJlcHJlc2VudHMgdGhlXG4gKiBNUEVHLURBU0ggbWVkaWEgc291cmNlIGJlaW5nIGhhbmRsZWQuXG4gKlxuICogQHBhcmFtIHNvdXJjZVVyaSB7c3RyaW5nfVxuICogQHBhcmFtIGF1dG9Mb2FkICB7Ym9vbGVhbn1cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBNYW5pZmVzdENvbnRyb2xsZXIoc291cmNlVXJpLCBhdXRvTG9hZCkge1xuICAgIHRoaXMuX19hdXRvTG9hZCA9IHRydXRoeShhdXRvTG9hZCk7XG4gICAgdGhpcy5zZXRTb3VyY2VVcmkoc291cmNlVXJpKTtcbn1cblxuLyoqXG4gKiBFbnVtZXJhdGlvbiBvZiBldmVudHMgaW5zdGFuY2VzIG9mIHRoaXMgb2JqZWN0IHdpbGwgZGlzcGF0Y2guXG4gKi9cbk1hbmlmZXN0Q29udHJvbGxlci5wcm90b3R5cGUuZXZlbnRMaXN0ID0ge1xuICAgIE1BTklGRVNUX0xPQURFRDogJ21hbmlmZXN0TG9hZGVkJ1xufTtcblxuTWFuaWZlc3RDb250cm9sbGVyLnByb3RvdHlwZS5nZXRTb3VyY2VVcmkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fX3NvdXJjZVVyaTtcbn07XG5cbk1hbmlmZXN0Q29udHJvbGxlci5wcm90b3R5cGUuc2V0U291cmNlVXJpID0gZnVuY3Rpb24gc2V0U291cmNlVXJpKHNvdXJjZVVyaSkge1xuICAgIC8vIFRPRE86ICdleGlzdHkoKScgY2hlY2sgZm9yIGJvdGg/XG4gICAgaWYgKHNvdXJjZVVyaSA9PT0gdGhpcy5fX3NvdXJjZVVyaSkgeyByZXR1cm47IH1cblxuICAgIC8vIFRPRE86IGlzU3RyaW5nKCkgY2hlY2s/ICdleGlzdHkoKScgY2hlY2s/XG4gICAgaWYgKCFzb3VyY2VVcmkpIHtcbiAgICAgICAgdGhpcy5fX2NsZWFyU291cmNlVXJpKCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBOZWVkIHRvIHBvdGVudGlhbGx5IHJlbW92ZSB1cGRhdGUgaW50ZXJ2YWwgZm9yIHJlLXJlcXVlc3RpbmcgdGhlIE1QRCBtYW5pZmVzdCAoaW4gY2FzZSBpdCBpcyBhIGR5bmFtaWMgTVBEKVxuICAgIHRoaXMuX19jbGVhckN1cnJlbnRVcGRhdGVJbnRlcnZhbCgpO1xuICAgIHRoaXMuX19zb3VyY2VVcmkgPSBzb3VyY2VVcmk7XG4gICAgLy8gSWYgd2Ugc2hvdWxkIGF1dG9tYXRpY2FsbHkgbG9hZCB0aGUgTVBELCBnbyBhaGVhZCBhbmQga2ljayBvZmYgbG9hZGluZyBpdC5cbiAgICBpZiAodGhpcy5fX2F1dG9Mb2FkKSB7XG4gICAgICAgIC8vIFRPRE86IEltcGwgYW55IGNsZWFudXAgZnVuY3Rpb25hbGl0eSBhcHByb3ByaWF0ZSBiZWZvcmUgbG9hZC5cbiAgICAgICAgdGhpcy5sb2FkKCk7XG4gICAgfVxufTtcblxuTWFuaWZlc3RDb250cm9sbGVyLnByb3RvdHlwZS5fX2NsZWFyU291cmNlVXJpID0gZnVuY3Rpb24gY2xlYXJTb3VyY2VVcmkoKSB7XG4gICAgdGhpcy5fX3NvdXJjZVVyaSA9IG51bGw7XG4gICAgLy8gTmVlZCB0byBwb3RlbnRpYWxseSByZW1vdmUgdXBkYXRlIGludGVydmFsIGZvciByZS1yZXF1ZXN0aW5nIHRoZSBNUEQgbWFuaWZlc3QgKGluIGNhc2UgaXQgaXMgYSBkeW5hbWljIE1QRClcbiAgICB0aGlzLl9fY2xlYXJDdXJyZW50VXBkYXRlSW50ZXJ2YWwoKTtcbiAgICAvLyBUT0RPOiBpbXBsIGFueSBvdGhlciBjbGVhbnVwIGZ1bmN0aW9uYWxpdHlcbn07XG5cbi8qKlxuICogS2ljayBvZmYgbG9hZGluZyB0aGUgREFTSCBNUEQgTWFuaWZlc3QgKHNlcnZlZCBAIHRoZSBNYW5pZmVzdENvbnRyb2xsZXIgaW5zdGFuY2UncyBfX3NvdXJjZVVyaSlcbiAqL1xuTWFuaWZlc3RDb250cm9sbGVyLnByb3RvdHlwZS5sb2FkID0gZnVuY3Rpb24gbG9hZCgpIHtcbiAgICAvLyBUT0RPOiBDdXJyZW50bHkgY2xlYXJpbmcgJiByZS1zZXR0aW5nIHVwZGF0ZSBpbnRlcnZhbCBhZnRlciBldmVyeSByZXF1ZXN0LiBFaXRoZXIgdXNlIHNldFRpbWVvdXQoKSBvciBvbmx5IHNldHVwIGludGVydmFsIG9uY2VcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgbG9hZE1hbmlmZXN0KHNlbGYuX19zb3VyY2VVcmksIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgc2VsZi5fX21hbmlmZXN0ID0gZGF0YS5tYW5pZmVzdFhtbDtcbiAgICAgICAgLy8gKFBvdGVudGlhbGx5KSBzZXR1cCB0aGUgdXBkYXRlIGludGVydmFsIGZvciByZS1yZXF1ZXN0aW5nIHRoZSBNUEQgKGluIGNhc2UgdGhlIG1hbmlmZXN0IGlzIGR5bmFtaWMpXG4gICAgICAgIHNlbGYuX19zZXR1cFVwZGF0ZUludGVydmFsKCk7XG4gICAgICAgIC8vIERpc3BhdGNoIGV2ZW50IHRvIG5vdGlmeSB0aGF0IHRoZSBtYW5pZmVzdCBoYXMgbG9hZGVkLlxuICAgICAgICBzZWxmLnRyaWdnZXIoeyB0eXBlOnNlbGYuZXZlbnRMaXN0Lk1BTklGRVNUX0xPQURFRCwgdGFyZ2V0OnNlbGYsIGRhdGE6c2VsZi5fX21hbmlmZXN0fSk7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqICdQcml2YXRlJyBtZXRob2QgdGhhdCByZW1vdmVzIHRoZSB1cGRhdGUgaW50ZXJ2YWwgKGlmIGl0IGV4aXN0cyksIHNvIHRoZSBNYW5pZmVzdENvbnRyb2xsZXIgaW5zdGFuY2Ugd2lsbCBubyBsb25nZXJcbiAqIHBlcmlvZGljYWxseSByZS1yZXF1ZXN0IHRoZSBtYW5pZmVzdCAoaWYgaXQncyBkeW5hbWljKS5cbiAqL1xuTWFuaWZlc3RDb250cm9sbGVyLnByb3RvdHlwZS5fX2NsZWFyQ3VycmVudFVwZGF0ZUludGVydmFsID0gZnVuY3Rpb24gY2xlYXJDdXJyZW50VXBkYXRlSW50ZXJ2YWwoKSB7XG4gICAgaWYgKCFleGlzdHkodGhpcy5fX3VwZGF0ZUludGVydmFsKSkgeyByZXR1cm47IH1cbiAgICBjbGVhckludGVydmFsKHRoaXMuX191cGRhdGVJbnRlcnZhbCk7XG59O1xuXG4vKipcbiAqIFNldHMgdXAgYW4gaW50ZXJ2YWwgdG8gcmUtcmVxdWVzdCB0aGUgbWFuaWZlc3QgKGlmIGl0J3MgZHluYW1pYylcbiAqL1xuTWFuaWZlc3RDb250cm9sbGVyLnByb3RvdHlwZS5fX3NldHVwVXBkYXRlSW50ZXJ2YWwgPSBmdW5jdGlvbiBzZXR1cFVwZGF0ZUludGVydmFsKCkge1xuICAgIC8vIElmIHRoZXJlJ3MgYWxyZWFkeSBhbiB1cGRhdGVJbnRlcnZhbCBmdW5jdGlvbiwgcmVtb3ZlIGl0LlxuICAgIGlmICh0aGlzLl9fdXBkYXRlSW50ZXJ2YWwpIHsgdGhpcy5fX2NsZWFyQ3VycmVudFVwZGF0ZUludGVydmFsKCk7IH1cbiAgICAvLyBJZiB3ZSBzaG91bGRuJ3QgdXBkYXRlLCBqdXN0IGJhaWwuXG4gICAgaWYgKCF0aGlzLmdldFNob3VsZFVwZGF0ZSgpKSB7IHJldHVybjsgfVxuICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgbWluVXBkYXRlUmF0ZSA9IDIsXG4gICAgICAgIHVwZGF0ZVJhdGUgPSBNYXRoLm1heCh0aGlzLmdldFVwZGF0ZVJhdGUoKSwgbWluVXBkYXRlUmF0ZSk7XG4gICAgLy8gU2V0dXAgdGhlIHVwZGF0ZSBpbnRlcnZhbCBiYXNlZCBvbiB0aGUgdXBkYXRlIHJhdGUgKGRldGVybWluZWQgZnJvbSB0aGUgbWFuaWZlc3QpIG9yIHRoZSBtaW5pbXVtIHVwZGF0ZSByYXRlXG4gICAgLy8gKHdoaWNoZXZlcidzIGxhcmdlcikuXG4gICAgLy8gTk9URTogTXVzdCBzdG9yZSByZWYgdG8gY3JlYXRlZCBpbnRlcnZhbCB0byBwb3RlbnRpYWxseSBjbGVhci9yZW1vdmUgaXQgbGF0ZXJcbiAgICB0aGlzLl9fdXBkYXRlSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgc2VsZi5sb2FkKCk7XG4gICAgfSwgdXBkYXRlUmF0ZSAqIDEwMDApO1xufTtcblxuLyoqXG4gKiBHZXRzIHRoZSB0eXBlIG9mIHBsYXlsaXN0ICgnc3RhdGljJyBvciAnZHluYW1pYycsIHdoaWNoIG5lYXJseSBpbnZhcmlhYmx5IGNvcnJlc3BvbmRzIHRvIGxpdmUgdnMuIHZvZCkgZGVmaW5lZCBpbiB0aGVcbiAqIG1hbmlmZXN0LlxuICpcbiAqIEByZXR1cm5zIHtzdHJpbmd9ICAgIHRoZSBwbGF5bGlzdCB0eXBlIChlaXRoZXIgJ3N0YXRpYycgb3IgJ2R5bmFtaWMnKVxuICovXG5NYW5pZmVzdENvbnRyb2xsZXIucHJvdG90eXBlLmdldFBsYXlsaXN0VHlwZSA9IGZ1bmN0aW9uIGdldFBsYXlsaXN0VHlwZSgpIHtcbiAgICB2YXIgcGxheWxpc3RUeXBlID0gZ2V0TXBkKHRoaXMuX19tYW5pZmVzdCkuZ2V0VHlwZSgpO1xuICAgIHJldHVybiBwbGF5bGlzdFR5cGU7XG59O1xuXG5NYW5pZmVzdENvbnRyb2xsZXIucHJvdG90eXBlLmdldFVwZGF0ZVJhdGUgPSBmdW5jdGlvbiBnZXRVcGRhdGVSYXRlKCkge1xuICAgIHZhciBtaW5pbXVtVXBkYXRlUGVyaW9kU3RyID0gZ2V0TXBkKHRoaXMuX19tYW5pZmVzdCkuZ2V0TWluaW11bVVwZGF0ZVBlcmlvZCgpLFxuICAgICAgICBtaW5pbXVtVXBkYXRlUGVyaW9kID0gcGFyc2VNZWRpYVByZXNlbnRhdGlvbkR1cmF0aW9uKG1pbmltdW1VcGRhdGVQZXJpb2RTdHIpO1xuICAgIHJldHVybiBtaW5pbXVtVXBkYXRlUGVyaW9kIHx8IDA7XG59O1xuXG5NYW5pZmVzdENvbnRyb2xsZXIucHJvdG90eXBlLmdldFNob3VsZFVwZGF0ZSA9IGZ1bmN0aW9uIGdldFNob3VsZFVwZGF0ZSgpIHtcbiAgICB2YXIgaXNEeW5hbWljID0gKHRoaXMuZ2V0UGxheWxpc3RUeXBlKCkgPT09ICdkeW5hbWljJyksXG4gICAgICAgIGhhc1ZhbGlkVXBkYXRlUmF0ZSA9ICh0aGlzLmdldFVwZGF0ZVJhdGUoKSA+IDApO1xuICAgIHJldHVybiAoaXNEeW5hbWljICYmIGhhc1ZhbGlkVXBkYXRlUmF0ZSk7XG59O1xuXG5NYW5pZmVzdENvbnRyb2xsZXIucHJvdG90eXBlLmdldE1wZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBnZXRNcGQodGhpcy5fX21hbmlmZXN0KTtcbn07XG5cbi8qKlxuICpcbiAqIEBwYXJhbSB0eXBlXG4gKiBAcmV0dXJucyB7TWVkaWFTZXR9XG4gKi9cbk1hbmlmZXN0Q29udHJvbGxlci5wcm90b3R5cGUuZ2V0TWVkaWFTZXRCeVR5cGUgPSBmdW5jdGlvbiBnZXRNZWRpYVNldEJ5VHlwZSh0eXBlKSB7XG4gICAgdmFyIGFkYXB0YXRpb25TZXQ7XG4gICAgaWYgKG1lZGlhVHlwZXMuaW5kZXhPZih0eXBlKSA8IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHR5cGUuIFZhbHVlIG11c3QgYmUgb25lIG9mOiAnICsgbWVkaWFUeXBlcy5qb2luKCcsICcpKTtcbiAgICB9XG4gICAgLy8gZmluZCB0aGUgZmlyc3QgYWRhcHRhdGlvbiBzZXQgdGhhdCBoYXMgYSBtaW1lIHR5cGUgY29tcGF0aWJsZVxuICAgIC8vIHdpdGggXCJ0eXBlXCIgc3BlY2lmaWVkIG9uIGl0c2VsZiBvciBvbmUgb2YgaXRzIGNoaWxkXG4gICAgLy8gcmVwcmVzZW50YXRpb25zXG4gICAgYWRhcHRhdGlvblNldCA9IGdldE1wZCh0aGlzLl9fbWFuaWZlc3QpLmdldFBlcmlvZHMoKVswXS5nZXRBZGFwdGF0aW9uU2V0cygpXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24oYWRhcHRhdGlvblNldCkge1xuICAgICAgICAgICAgdmFyIG1pbWVUeXBlID0gYWRhcHRhdGlvblNldC54bWwuZ2V0QXR0cmlidXRlKCdtaW1lVHlwZScpIHx8ICcnO1xuICAgICAgICAgICAgaWYgKG1pbWVUeXBlLmluZGV4T2YodHlwZSkgPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYWRhcHRhdGlvblNldDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhZGFwdGF0aW9uU2V0LnhtbFxuICAgICAgICAgICAgICAgIC5xdWVyeVNlbGVjdG9yKCdSZXByZXNlbnRhdGlvblttaW1lVHlwZV49XCInICsgdHlwZSArICdcIl0nKTtcbiAgICAgICAgfSlbMF07XG4gICAgcmV0dXJuIGFkYXB0YXRpb25TZXQgPyBuZXcgTWVkaWFTZXQoYWRhcHRhdGlvblNldCkgOiBudWxsO1xufTtcblxuLyoqXG4gKlxuICogQHJldHVybnMge0FycmF5LjxNZWRpYVNldD59XG4gKi9cbk1hbmlmZXN0Q29udHJvbGxlci5wcm90b3R5cGUuZ2V0TWVkaWFTZXRzID0gZnVuY3Rpb24gZ2V0TWVkaWFTZXRzKCkge1xuICAgIHZhciBhZGFwdGF0aW9uU2V0cyA9IGdldE1wZCh0aGlzLl9fbWFuaWZlc3QpLmdldFBlcmlvZHMoKVswXS5nZXRBZGFwdGF0aW9uU2V0cygpLFxuICAgICAgICBtZWRpYVNldHMgPSBhZGFwdGF0aW9uU2V0cy5tYXAoZnVuY3Rpb24oYWRhcHRhdGlvblNldCkgeyByZXR1cm4gbmV3IE1lZGlhU2V0KGFkYXB0YXRpb25TZXQpOyB9KTtcbiAgICByZXR1cm4gbWVkaWFTZXRzO1xufTtcblxuLy8gTWl4aW4gZXZlbnQgaGFuZGxpbmcgZm9yIHRoZSBNYW5pZmVzdENvbnRyb2xsZXIgb2JqZWN0IHR5cGUgZGVmaW5pdGlvbi5cbmV4dGVuZE9iamVjdChNYW5pZmVzdENvbnRyb2xsZXIucHJvdG90eXBlLCBFdmVudERpc3BhdGNoZXJNaXhpbik7XG5cbm1vZHVsZS5leHBvcnRzID0gTWFuaWZlc3RDb250cm9sbGVyO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBbJ3ZpZGVvJywgJ2F1ZGlvJ107IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZ2V0RGFzaFV0aWwgPSByZXF1aXJlKCcuLi9kYXNoL21wZC9nZXREYXNoVXRpbC5qcycpLFxuICAgIGRhc2hVdGlsID0gZ2V0RGFzaFV0aWwoKSxcbiAgICBwYXJzZVJvb3RVcmwgPSBkYXNoVXRpbC5wYXJzZVJvb3RVcmw7XG5cbmZ1bmN0aW9uIGxvYWRNYW5pZmVzdCh1cmwsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGFjdHVhbFVybCA9IHBhcnNlUm9vdFVybCh1cmwpLFxuICAgICAgICByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCksXG4gICAgICAgIG9ubG9hZDtcblxuICAgIHJlcXVlc3Qub3ZlcnJpZGVNaW1lVHlwZSgnYXBwbGljYXRpb24veG1sJyk7XG5cbiAgICBvbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChyZXF1ZXN0LnN0YXR1cyA8IDIwMCB8fCByZXF1ZXN0LnN0YXR1cyA+IDI5OSkgeyByZXR1cm47IH1cblxuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7IGNhbGxiYWNrKHttYW5pZmVzdFhtbDogcmVxdWVzdC5yZXNwb25zZVhNTCB9KTsgfVxuICAgIH07XG5cbiAgICB0cnkge1xuICAgICAgICByZXF1ZXN0Lm9ubG9hZCA9IG9ubG9hZDtcbiAgICAgICAgcmVxdWVzdC5vcGVuKCdHRVQnLCB1cmwsIHRydWUpO1xuICAgICAgICByZXF1ZXN0LnNlbmQoKTtcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgcmVxdWVzdC5vbmVycm9yKGUpO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBsb2FkTWFuaWZlc3Q7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnLi4vdXRpbC9pc0Z1bmN0aW9uLmpzJyk7XG5cbi8qKlxuICogR2VuZXJpYyBmdW5jdGlvbiBmb3IgbG9hZGluZyBNUEVHLURBU0ggc2VnbWVudHMgKGluY2x1ZGluZyBpbml0aWFsaXphdGlvbiBzZWdtZW50cylcbiAqIEBwYXJhbSBzZWdtZW50IHtvYmplY3R9ICAgICAgIGRhdGEgdmlldyByZXByZXNlbnRpbmcgYSBzZWdtZW50IChhbmQgcmVsZXZhbnQgZGF0YSBmb3IgdGhhdCBzZWdtZW50KVxuICogQHBhcmFtIHN1Y2Nlc3NGbiB7ZnVuY3Rpb259ICBmdW5jdGlvbiBjYWxsZWQgb24gc3VjY2Vzc2Z1bCByZXNwb25zZVxuICogQHBhcmFtIGZhaWxGbiB7ZnVuY3Rpb259ICAgICBmdW5jdGlvbiBjYWxsZWQgb24gZmFpbGVkIHJlc3BvbnNlXG4gKiBAcGFyYW0gdGhpc0FyZyB7b2JqZWN0fSAgICAgIG9iamVjdCB1c2VkIGFzIHRoZSB0aGlzIGNvbnRleHQgZm9yIHN1Y2Nlc3NGbiBhbmQgZmFpbEZuXG4gKi9cbmZ1bmN0aW9uIGxvYWRTZWdtZW50KHNlZ21lbnQsIHN1Y2Nlc3NGbiwgZmFpbEZuLCB0aGlzQXJnKSB7XG4gICAgdmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKSxcbiAgICAgICAgdXJsID0gc2VnbWVudC5nZXRVcmwoKTtcblxuICAgIGZ1bmN0aW9uIG9ubG9hZCgpIHtcbiAgICAgICAgLy8gSWYgdGhlIGxvYWQgc3RhdHVzIHdhcyBvdXRzaWRlIG9mIHRoZSAyMDBzIHJhbmdlLCBjb25zaWRlciBpdCBhIGZhaWxlZCByZXF1ZXN0LlxuICAgICAgICBpZiAocmVxdWVzdC5zdGF0dXMgPCAyMDAgfHwgcmVxdWVzdC5zdGF0dXMgPiAyOTkpIHtcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKGZhaWxGbikpIHtcbiAgICAgICAgICAgICAgICBmYWlsRm4uY2FsbCh0aGlzQXJnLCAge1xuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0ZWRTZWdtZW50OiBzZWdtZW50LFxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZTogcmVxdWVzdC5yZXNwb25zZSxcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiByZXF1ZXN0LnN0YXR1c1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24oc3VjY2Vzc0ZuKSkge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3NGbi5jYWxsKHRoaXNBcmcsIHtcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdGVkU2VnbWVudDogc2VnbWVudCxcbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2U6IHJlcXVlc3QucmVzcG9uc2UsXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1czogcmVxdWVzdC5zdGF0dXNcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uZXJyb3IoKSB7XG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKGZhaWxGbikpIHtcbiAgICAgICAgICAgIGZhaWxGbi5jYWxsKHRoaXNBcmcsICB7XG4gICAgICAgICAgICAgICAgcmVxdWVzdGVkU2VnbWVudDogc2VnbWVudCxcbiAgICAgICAgICAgICAgICByZXNwb25zZTogcmVxdWVzdC5yZXNwb25zZSxcbiAgICAgICAgICAgICAgICBzdGF0dXM6IHJlcXVlc3Quc3RhdHVzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlcXVlc3Qub3BlbignR0VUJywgdXJsLCB0cnVlKTtcbiAgICByZXF1ZXN0LnJlc3BvbnNlVHlwZSA9ICdhcnJheWJ1ZmZlcic7XG4gICAgcmVxdWVzdC5vbmxvYWQgPSBvbmxvYWQ7XG4gICAgcmVxdWVzdC5vbmVycm9yID0gb25lcnJvcjtcbiAgICByZXF1ZXN0LnNlbmQoKTtcblxuICAgIHJldHVybiByZXF1ZXN0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGxvYWRTZWdtZW50OyIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gY29tcGFyZVNlZ21lbnRMaXN0c0J5QmFuZHdpZHRoQXNjZW5kaW5nKHNlZ21lbnRMaXN0QSwgc2VnbWVudExpc3RCKSB7XG4gICAgdmFyIGJhbmR3aWR0aEEgPSBzZWdtZW50TGlzdEEuZ2V0QmFuZHdpZHRoKCksXG4gICAgICAgIGJhbmR3aWR0aEIgPSBzZWdtZW50TGlzdEIuZ2V0QmFuZHdpZHRoKCk7XG4gICAgcmV0dXJuIGJhbmR3aWR0aEEgLSBiYW5kd2lkdGhCO1xufVxuXG5mdW5jdGlvbiBjb21wYXJlU2VnbWVudExpc3RzQnlXaWR0aEFzY2VuZGluZyhzZWdtZW50TGlzdEEsIHNlZ21lbnRMaXN0Qikge1xuICAgIHZhciB3aWR0aEEgPSBzZWdtZW50TGlzdEEuZ2V0V2lkdGgoKSB8fCAwLFxuICAgICAgICB3aWR0aEIgPSBzZWdtZW50TGlzdEIuZ2V0V2lkdGgoKSB8fCAwO1xuICAgIHJldHVybiB3aWR0aEEgLSB3aWR0aEI7XG59XG5cbmZ1bmN0aW9uIGNvbXBhcmVTZWdtZW50TGlzdHNCeVdpZHRoVGhlbkJhbmR3aWR0aEFzY2VuZGluZyhzZWdtZW50TGlzdEEsIHNlZ21lbnRMaXN0Qikge1xuICAgIHZhciByZXNvbHV0aW9uQ29tcGFyZSA9IGNvbXBhcmVTZWdtZW50TGlzdHNCeVdpZHRoQXNjZW5kaW5nKHNlZ21lbnRMaXN0QSwgc2VnbWVudExpc3RCKTtcbiAgICByZXR1cm4gKHJlc29sdXRpb25Db21wYXJlICE9PSAwKSA/IHJlc29sdXRpb25Db21wYXJlIDogY29tcGFyZVNlZ21lbnRMaXN0c0J5QmFuZHdpZHRoQXNjZW5kaW5nKHNlZ21lbnRMaXN0QSwgc2VnbWVudExpc3RCKTtcbn1cblxuZnVuY3Rpb24gZmlsdGVyU2VnbWVudExpc3RzQnlSZXNvbHV0aW9uKHNlZ21lbnRMaXN0LCBtYXhXaWR0aCwgbWF4SGVpZ2h0KSB7XG4gICAgdmFyIHdpZHRoID0gc2VnbWVudExpc3QuZ2V0V2lkdGgoKSB8fCAwLFxuICAgICAgICBoZWlnaHQgPSBzZWdtZW50TGlzdC5nZXRIZWlnaHQoKSB8fCAwO1xuICAgIHJldHVybiAoKHdpZHRoIDw9IG1heFdpZHRoKSAmJiAoaGVpZ2h0IDw9IG1heEhlaWdodCkpO1xufVxuXG5mdW5jdGlvbiBmaWx0ZXJTZWdtZW50TGlzdHNCeURvd25sb2FkUmF0ZShzZWdtZW50TGlzdCwgY3VycmVudFNlZ21lbnRMaXN0QmFuZHdpZHRoLCBkb3dubG9hZFJhdGVSYXRpbykge1xuICAgIHZhciBzZWdtZW50TGlzdEJhbmR3aWR0aCA9IHNlZ21lbnRMaXN0LmdldEJhbmR3aWR0aCgpLFxuICAgICAgICBzZWdtZW50QmFuZHdpZHRoUmF0aW8gPSBzZWdtZW50TGlzdEJhbmR3aWR0aCAvIGN1cnJlbnRTZWdtZW50TGlzdEJhbmR3aWR0aDtcbiAgICBkb3dubG9hZFJhdGVSYXRpbyA9IGRvd25sb2FkUmF0ZVJhdGlvIHx8IE51bWJlci5NQVhfVkFMVUU7XG4gICAgcmV0dXJuIChkb3dubG9hZFJhdGVSYXRpbyA+PSBzZWdtZW50QmFuZHdpZHRoUmF0aW8pO1xufVxuXG4vLyBOT1RFOiBQYXNzaW5nIGluIG1lZGlhU2V0IGluc3RlYWQgb2YgbWVkaWFTZXQncyBTZWdtZW50TGlzdCBBcnJheSBzaW5jZSBzb3J0IGlzIGRlc3RydWN0aXZlIGFuZCBkb24ndCB3YW50IHRvIGNsb25lLlxuLy8gICAgICBBbHNvIGFsbG93cyBmb3IgZ3JlYXRlciBmbGV4aWJpbGl0eSBvZiBmbi5cbmZ1bmN0aW9uIHNlbGVjdFNlZ21lbnRMaXN0KG1lZGlhU2V0LCBkYXRhKSB7XG4gICAgdmFyIGRvd25sb2FkUmF0ZVJhdGlvID0gZGF0YS5kb3dubG9hZFJhdGVSYXRpbyxcbiAgICAgICAgY3VycmVudFNlZ21lbnRMaXN0QmFuZHdpZHRoID0gZGF0YS5jdXJyZW50U2VnbWVudExpc3RCYW5kd2lkdGgsXG4gICAgICAgIHdpZHRoID0gZGF0YS53aWR0aCxcbiAgICAgICAgaGVpZ2h0ID0gZGF0YS5oZWlnaHQsXG4gICAgICAgIHNvcnRlZEJ5QmFuZHdpZHRoID0gbWVkaWFTZXQuZ2V0U2VnbWVudExpc3RzKCkuc29ydChjb21wYXJlU2VnbWVudExpc3RzQnlCYW5kd2lkdGhBc2NlbmRpbmcpLFxuICAgICAgICBmaWx0ZXJlZEJ5RG93bmxvYWRSYXRlLFxuICAgICAgICBmaWx0ZXJlZEJ5UmVzb2x1dGlvbixcbiAgICAgICAgcHJvcG9zZWRTZWdtZW50TGlzdDtcblxuICAgIGZ1bmN0aW9uIGZpbHRlckJ5UmVzb2x1dGlvbihzZWdtZW50TGlzdCkge1xuICAgICAgICByZXR1cm4gZmlsdGVyU2VnbWVudExpc3RzQnlSZXNvbHV0aW9uKHNlZ21lbnRMaXN0LCB3aWR0aCwgaGVpZ2h0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaWx0ZXJCeURvd25sb2FkUmF0ZShzZWdtZW50TGlzdCkge1xuICAgICAgICByZXR1cm4gZmlsdGVyU2VnbWVudExpc3RzQnlEb3dubG9hZFJhdGUoc2VnbWVudExpc3QsIGN1cnJlbnRTZWdtZW50TGlzdEJhbmR3aWR0aCwgZG93bmxvYWRSYXRlUmF0aW8pO1xuICAgIH1cblxuICAgIGZpbHRlcmVkQnlEb3dubG9hZFJhdGUgPSBzb3J0ZWRCeUJhbmR3aWR0aC5maWx0ZXIoZmlsdGVyQnlEb3dubG9hZFJhdGUpO1xuICAgIGZpbHRlcmVkQnlSZXNvbHV0aW9uID0gZmlsdGVyZWRCeURvd25sb2FkUmF0ZS5zb3J0KGNvbXBhcmVTZWdtZW50TGlzdHNCeVdpZHRoVGhlbkJhbmR3aWR0aEFzY2VuZGluZykuZmlsdGVyKGZpbHRlckJ5UmVzb2x1dGlvbik7XG5cbiAgICBwcm9wb3NlZFNlZ21lbnRMaXN0ID0gZmlsdGVyZWRCeVJlc29sdXRpb25bZmlsdGVyZWRCeVJlc29sdXRpb24ubGVuZ3RoIC0gMV0gfHwgc29ydGVkQnlCYW5kd2lkdGhbMF07XG5cbiAgICByZXR1cm4gcHJvcG9zZWRTZWdtZW50TGlzdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzZWxlY3RTZWdtZW50TGlzdDsiLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGV4aXN0eSh4KSB7IHJldHVybiAoeCAhPT0gbnVsbCkgJiYgKHggIT09IHVuZGVmaW5lZCk7IH1cblxubW9kdWxlLmV4cG9ydHMgPSBleGlzdHk7IiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBFeHRlbmQgYSBnaXZlbiBvYmplY3Qgd2l0aCBhbGwgdGhlIHByb3BlcnRpZXMgKGFuZCB0aGVpciB2YWx1ZXMpIGZvdW5kIGluIHRoZSBwYXNzZWQtaW4gb2JqZWN0KHMpLlxudmFyIGV4dGVuZE9iamVjdCA9IGZ1bmN0aW9uKG9iaiAvKiwgZXh0ZW5kT2JqZWN0MSwgZXh0ZW5kT2JqZWN0MiwgLi4uLCBleHRlbmRPYmplY3ROICovKSB7XG4gICAgdmFyIGV4dGVuZE9iamVjdHNBcnJheSA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSksXG4gICAgICAgIGksXG4gICAgICAgIGxlbmd0aCA9IGV4dGVuZE9iamVjdHNBcnJheS5sZW5ndGgsXG4gICAgICAgIGV4dGVuZE9iamVjdDtcblxuICAgIGZvcihpPTA7IGk8bGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZXh0ZW5kT2JqZWN0ID0gZXh0ZW5kT2JqZWN0c0FycmF5W2ldO1xuICAgICAgICBpZiAoZXh0ZW5kT2JqZWN0KSB7XG4gICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIGV4dGVuZE9iamVjdCkge1xuICAgICAgICAgICAgICAgIG9ialtwcm9wXSA9IGV4dGVuZE9iamVjdFtwcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvYmo7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4dGVuZE9iamVjdDsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBpc0FycmF5ID0gcmVxdWlyZSgnLi9pc0FycmF5LmpzJyksXG4gICAgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJy4vaXNGdW5jdGlvbi5qcycpLFxuICAgIGZpbmRFbGVtZW50SW5BcnJheTtcblxuZmluZEVsZW1lbnRJbkFycmF5ID0gZnVuY3Rpb24oYXJyYXksIHByZWRpY2F0ZUZuKSB7XG4gICAgaWYgKCFpc0FycmF5KGFycmF5KSB8fCAhaXNGdW5jdGlvbihwcmVkaWNhdGVGbikpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfVxuICAgIHZhciBpLFxuICAgICAgICBsZW5ndGggPSBhcnJheS5sZW5ndGgsXG4gICAgICAgIGVsZW07XG5cbiAgICBmb3IgKGk9MDsgaTxsZW5ndGg7IGkrKykge1xuICAgICAgICBlbGVtID0gYXJyYXlbaV07XG4gICAgICAgIGlmIChwcmVkaWNhdGVGbihlbGVtLCBpLCBhcnJheSkpIHsgcmV0dXJuIGVsZW07IH1cbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmaW5kRWxlbWVudEluQXJyYXk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZXhpc3R5ID0gcmVxdWlyZSgnLi9leGlzdHkuanMnKSxcbiAgICBpc1N0cmluZyA9IHJlcXVpcmUoJy4vaXNTdHJpbmcuanMnKSxcbiAgICBmaW5kRWxlbWVudEluQXJyYXkgPSByZXF1aXJlKCcuL2ZpbmRFbGVtZW50SW5BcnJheS5qcycpLFxuICAgIGdldE1lZGlhVHlwZUZyb21NaW1lVHlwZTtcblxuLyoqXG4gKlxuICogRnVuY3Rpb24gdXNlZCB0byBnZXQgdGhlIG1lZGlhIHR5cGUgYmFzZWQgb24gdGhlIG1pbWUgdHlwZS4gVXNlZCB0byBkZXRlcm1pbmUgdGhlIG1lZGlhIHR5cGUgb2YgQWRhcHRhdGlvbiBTZXRzXG4gKiBvciBjb3JyZXNwb25kaW5nIGRhdGEgcmVwcmVzZW50YXRpb25zLlxuICpcbiAqIEBwYXJhbSBtaW1lVHlwZSB7c3RyaW5nfSBtaW1lIHR5cGUgZm9yIGEgREFTSCBNUEQgQWRhcHRhdGlvbiBTZXQgKHNwZWNpZmllZCBhcyBhbiBhdHRyaWJ1dGUgc3RyaW5nKVxuICogQHBhcmFtIHR5cGVzIHtzdHJpbmd9ICAgIHN1cHBvcnRlZCBtZWRpYSB0eXBlcyAoZS5nLiAndmlkZW8sJyAnYXVkaW8sJylcbiAqIEByZXR1cm5zIHtzdHJpbmd9ICAgICAgICB0aGUgbWVkaWEgdHlwZSB0aGF0IGNvcnJlc3BvbmRzIHRvIHRoZSBtaW1lIHR5cGUuXG4gKi9cbmdldE1lZGlhVHlwZUZyb21NaW1lVHlwZSA9IGZ1bmN0aW9uKG1pbWVUeXBlLCB0eXBlcykge1xuICAgIGlmICghaXNTdHJpbmcobWltZVR5cGUpKSB7IHJldHVybiBudWxsOyB9ICAgLy8gVE9ETzogVGhyb3cgZXJyb3I/XG4gICAgdmFyIG1hdGNoZWRUeXBlID0gZmluZEVsZW1lbnRJbkFycmF5KHR5cGVzLCBmdW5jdGlvbih0eXBlKSB7XG4gICAgICAgIHJldHVybiAoISFtaW1lVHlwZSAmJiBtaW1lVHlwZS5pbmRleE9mKHR5cGUpID49IDApO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG1hdGNoZWRUeXBlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBnZXRNZWRpYVR5cGVGcm9tTWltZVR5cGU7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZ2VuZXJpY09ialR5cGUgPSBmdW5jdGlvbigpe30sXG4gICAgb2JqZWN0UmVmID0gbmV3IGdlbmVyaWNPYmpUeXBlKCk7XG5cbmZ1bmN0aW9uIGlzQXJyYXkob2JqKSB7XG4gICAgcmV0dXJuIG9iamVjdFJlZi50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNBcnJheTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBnZW5lcmljT2JqVHlwZSA9IGZ1bmN0aW9uKCl7fSxcbiAgICBvYmplY3RSZWYgPSBuZXcgZ2VuZXJpY09ialR5cGUoKTtcblxudmFyIGlzRnVuY3Rpb24gPSBmdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJztcbn07XG4vLyBmYWxsYmFjayBmb3Igb2xkZXIgdmVyc2lvbnMgb2YgQ2hyb21lIGFuZCBTYWZhcmlcbmlmIChpc0Z1bmN0aW9uKC94LykpIHtcbiAgICBpc0Z1bmN0aW9uID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyAmJiBvYmplY3RSZWYudG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0Z1bmN0aW9uOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIGdlbmVyaWNPYmpUeXBlID0gZnVuY3Rpb24oKXt9LFxuICAgIG9iamVjdFJlZiA9IG5ldyBnZW5lcmljT2JqVHlwZSgpO1xuXG5mdW5jdGlvbiBpc051bWJlcih2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInIHx8XG4gICAgICAgIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgb2JqZWN0UmVmLnRvU3RyaW5nLmNhbGwodmFsdWUpID09PSAnW29iamVjdCBOdW1iZXJdJyB8fCBmYWxzZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc051bWJlcjsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBnZW5lcmljT2JqVHlwZSA9IGZ1bmN0aW9uKCl7fSxcbiAgICBvYmplY3RSZWYgPSBuZXcgZ2VuZXJpY09ialR5cGUoKTtcblxudmFyIGlzU3RyaW5nID0gZnVuY3Rpb24gaXNTdHJpbmcodmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyB8fFxuICAgICAgICB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIG9iamVjdFJlZi50b1N0cmluZy5jYWxsKHZhbHVlKSA9PT0gJ1tvYmplY3QgU3RyaW5nXScgfHwgZmFsc2U7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGlzU3RyaW5nOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIGV4aXN0eSA9IHJlcXVpcmUoJy4vZXhpc3R5LmpzJyk7XG5cbi8vIE5PVEU6IFRoaXMgdmVyc2lvbiBvZiB0cnV0aHkgYWxsb3dzIG1vcmUgdmFsdWVzIHRvIGNvdW50XG4vLyBhcyBcInRydWVcIiB0aGFuIHN0YW5kYXJkIEpTIEJvb2xlYW4gb3BlcmF0b3IgY29tcGFyaXNvbnMuXG4vLyBTcGVjaWZpY2FsbHksIHRydXRoeSgpIHdpbGwgcmV0dXJuIHRydWUgZm9yIHRoZSB2YWx1ZXNcbi8vIDAsIFwiXCIsIGFuZCBOYU4sIHdoZXJlYXMgSlMgd291bGQgdHJlYXQgdGhlc2UgYXMgXCJmYWxzeVwiIHZhbHVlcy5cbmZ1bmN0aW9uIHRydXRoeSh4KSB7IHJldHVybiAoeCAhPT0gZmFsc2UpICYmIGV4aXN0eSh4KTsgfVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRydXRoeTsiXX0=
