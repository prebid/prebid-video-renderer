import '../style.css';

import utils from './utils.js';

(() => {
  function renderVideoAd(bid) {
    const { divId, gptSlotName, gptSlot } = utils.getGptSlotInfoForAdUnitCode(bid.adUnitCode);
    const adContainerElement = document.getElementById(divId);
    const imaInstance = { adUnitCode: bid.adUnitCode, divId, adContainerElement, gptSlotName, gptSlot, muted: true, adsInitialized: false };

    // Setup IMA
    if (adContainerElement) {
      imaInstance.adDisplayContainer = new window.google.ima.AdDisplayContainer(adContainerElement);
      imaInstance.adsLoader = new window.google.ima.AdsLoader(imaInstance.adDisplayContainer);

      // Listen and respond to ads loaded and error events.
      imaInstance.adsLoader?.addEventListener(window.google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, onAdsManagerLoaded.bind(null, imaInstance));

      imaInstance.adDisplayContainer.initialize();
      imaInstance.adsInitialized = true;

      // Request video ads.
      const adsRequest = new window.google.ima.AdsRequest();
      adsRequest.adTagUrl = bid.vastUrl;

      adsRequest.linearAdSlotWidth = 640;
      adsRequest.linearAdSlotHeight = 390;

      adsRequest.setAdWillAutoPlay(true);
      adsRequest.setAdWillPlayMuted(true);
      imaInstance.adsLoader.requestAds(adsRequest);
    }
  }

  function onAdsManagerLoaded(imaInstance, adsManagerLoadedEvent) {
    const adsRenderingSettings = new window.google.ima.AdsRenderingSettings();
    imaInstance.adsManager = adsManagerLoadedEvent.getAdsManager({currentTime: 0}, adsRenderingSettings);

    // Mute the ad for autoplay.
    imaInstance.adsManager.setVolume(0);

    // Play the ad.
    playAd(imaInstance);
  }

  function playAd(imaInstance) {
    if (!imaInstance.adsInitialized) {
      imaInstance.adDisplayContainer.initialize();
      imaInstance.adsInitialized = true;
    }

    imaInstance.adsManager.init(640, 390, window.google.ima.ViewMode.NORMAL);
    imaInstance.adsManager.start();
  }

  function injectVideoConfig(bidRequests) {
    for (const bidRequest of bidRequests) {
      const hasVideoAds = bidRequest.mediaTypes?.video;

      // Add renderer config to video ads that don't have one.
      if (hasVideoAds && !hasVideoAds.renderer) {
        hasVideoAds.renderer = {
          url: 'https://imasdk.googleapis.com/js/sdkloader/ima3.js', 
          render: renderVideoAd,
        }
      }
    }
  }

  window.pbjs = window.pbjs || {que: []};
  window.pbjs.que.push(() => {
    // Make VAST URL finding more consistent.
    window.pbjs.mergeConfig({
      cache: {
        url: 'https://prebid.adnxs.com/pbc/v1/cache',
        ignoreBidderCacheKey: true,
      },
    })

    window.pbjs.onEvent('beforeRequestBids', ((bidRequests) => {
      injectVideoConfig(bidRequests);
    }))
  })
})();

