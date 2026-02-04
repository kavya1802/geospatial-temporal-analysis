import React, { useEffect, useRef } from 'react';
import Globe from 'globe.gl';

const GlobeBackground = () => {
  const globeContainerRef = useRef(null);
  const globeInstanceRef = useRef(null);

  useEffect(() => {
    if (!globeContainerRef.current || globeInstanceRef.current) return;

    // Initialize the globe - clean, no particles, no atmosphere outline
    const globe = Globe()(globeContainerRef.current)
      .globeImageUrl('https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('https://unpkg.com/three-globe@2.31.0/example/img/earth-topology.png')
      .backgroundColor('rgba(0,0,0,0)')
      .showAtmosphere(false)
      .width(700)
      .height(700);

    // Configure controls
    const controls = globe.controls();
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableRotate = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;

    // Set camera position
    globe.pointOfView({ lat: 20, lng: 30, altitude: 2.2 });

    globeInstanceRef.current = globe;

    return () => {
      // Cleanup
    };
  }, []);

  return (
    <>
      {/* Radial gradient overlay to blend the globe naturally */}
      <div
        style={{
          position: 'fixed',
          top: '240px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '800px',
          zIndex: 0,
          background: 'radial-gradient(circle, transparent 30%, rgba(74, 78, 105, 0.8) 60%, rgba(34, 34, 59, 1) 80%)',
          pointerEvents: 'none',
          borderRadius: '50%',
        }}
      />
      {/* Globe container */}
      <div
        ref={globeContainerRef}
        style={{
          position: 'fixed',
          top: '240px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '700px',
          zIndex: 0,
          opacity: 0.4,
          pointerEvents: 'none',
          filter: 'saturate(0.7)',
        }}
      />
    </>
  );
};

export default GlobeBackground;
