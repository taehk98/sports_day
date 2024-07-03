import React from 'react';
import AnimationWrapper from '../common/page-animation';
import map from '../assets/map.png';
import { Link } from 'react-router-dom';

const MapPage = () => {
    let isChromeOnIOS = false;
  
    if(navigator.userAgent.match('CriOS')){
        isChromeOnIOS = true;
    }

    const isChromeOnAndroid = /Chrome\/[.0-9]* Mobile/.test(navigator.userAgent) && /Android/.test(navigator.userAgent);
  return (
    <AnimationWrapper>
      <div style={{ height:'calc(100vh - 140px)', maxHeight: 'calc(100vh - 140px)'}} className="flex flex-col justify-start w-full px-2 pt-2">
        <div style={{ height: 'calc(100vh - 140px)'}} className="flex justify-center w-full mt-0">
          <img src={map} style={{ objectPosition: 'center top', height: 'calc(100vh - 140px)' }}  className="w-full md:w-3/5 md:h-full rounded-xl object-contain" alt="banner" />
        </div>
      </div>
    </AnimationWrapper>
  );
};

export default MapPage;