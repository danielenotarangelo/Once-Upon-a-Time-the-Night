import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useTranslation } from 'react-i18next';
import { TEXTURES, GLOBE_RADIUS as R } from '../../lib/constants.js';
import {
  vec3ToLatLon,
  countryAtLatLon,
  makeGeoPath,
  paintOverlay,
  TEX_W,
  TEX_H,
} from '../../lib/geo.js';
import { getVal, fmt, activeVarKey } from '../../lib/data.js';
import { VAR_META } from '../../lib/constants.js';


function getCountryCentroid(geo, name) {
  const feat = geo.features.find(f => f.properties.name === name);
  if (!feat) return null;
  const geom = feat.geometry;
  let coords = [];
  if (geom.type === 'Polygon') {
    coords = geom.coordinates[0];
  } else if (geom.type === 'MultiPolygon') {
    let best = geom.coordinates[0][0];
    for (const poly of geom.coordinates) {
      if (poly[0].length > best.length) best = poly[0];
    }
    coords = best;
  }
  if (!coords.length) return null;
  const lons = coords.map(c => c[0]);
  const lats = coords.map(c => c[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  if (maxLon - minLon > 180) {
    const shifted = lons.map(l => l < 0 ? l + 360 : l);
    let cl = (Math.min(...shifted) + Math.max(...shifted)) / 2;
    if (cl > 180) cl -= 360;
    return [cl, (minLat + maxLat) / 2];
  }
  return [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
}

export default function Globe({
  data,
  geo,
  year,
  variable,
  healthMetric,
  selected,
  compareCountry,
  onSelect,
  zoomMult = 1,
  flyTo = null,
  paused = false,
}) {
  const { t } = useTranslation();
  const mountRef = useRef(null);
  const canvasRef = useRef(null);
  const tooltipRef = useRef(null);

  // Mutable scene refs that persist across renders.
  const sceneRef    = useRef(null);
  const dayTexRef   = useRef(null);
  const viirsDataRef   = useRef({});   // { year: Float32Array }
  const updateViirsRef = useRef(null); // function(yr) — swaps point cloud
  const overlayCtxRef = useRef(null);
  const geoPathRef = useRef(null);
  const overlayTexRef = useRef(null);
  // Shared refs so the flyTo effect can control auto-rotation.
  const autoRotateRef = useRef(true);
  const startIdleTimerRef = useRef(null);
  // Keep latest props accessible inside event handlers / RAF loop.
  const propsRef = useRef({ data, geo, year, variable, healthMetric, selected, compareCountry, onSelect, paused, t });
  propsRef.current = { data, geo, year, variable, healthMetric, selected, compareCountry, onSelect, paused, t };

  const repaintOverlay = useCallback(() => {
    const { data, geo, year, variable, healthMetric, selected, compareCountry } = propsRef.current;
    if (!overlayCtxRef.current || !data || !geo) return;
    paintOverlay({
      ctx: overlayCtxRef.current,
      geoPath: geoPathRef.current,
      geo,
      data,
      year,
      variable,
      healthMetric,
      selected,
      compareCountry,
    });
    if (overlayTexRef.current) overlayTexRef.current.needsUpdate = true;
  }, []);

  // One-time scene setup.
  useEffect(() => {
    if (!data || !geo) return;
    const mount = mountRef.current;
    const canvas = canvasRef.current;
    const w = mount.clientWidth;
    const h = mount.clientHeight;

    // On portrait screens the horizontal FOV is narrower than vertical, so
    // the globe (radius R) can bleed past the sides. Compute a camera Z that
    // ensures the globe fits horizontally with a small margin.
    const TAN20 = Math.tan(20 * Math.PI / 180);
    const computeBaseZ = (aspect) => {
      const hHalfFov = Math.atan(TAN20 * Math.min(aspect, 1));
      return Math.max(8.7, R / Math.sin(hHalfFov * 0.88));
    };

    let baseZ = computeBaseZ(w / h);
    let zMin = baseZ * 0.333;
    let zMax = baseZ * 1.15;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 200);
    camera.position.set(0, 0, baseZ);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.55;

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x1a1c28,
      roughness: 0.88,
      metalness: 0.0,
    });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 128, 128), earthMat);
    worldGroup.add(earth);

    const applyDayTex = (t) => {
      dayTexRef.current = t;
      earthMat.map = t;
      earthMat.color.set(0xffffff);
      earthMat.needsUpdate = true;
    };

    loader.load(
      TEXTURES.day,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = renderer.capabilities.getMaxAnisotropy();
        applyDayTex(t);
      },
      undefined,
      () => {
        loader.load(TEXTURES.fallback, (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          applyDayTex(t);
        });
      }
    );
    loader.load(
      TEXTURES.spec,
      (t) => {
        // Invert water mask (white=ocean) → roughness map (black=smooth ocean, white=rough land)
        const cv = document.createElement('canvas');
        cv.width = t.image.width;
        cv.height = t.image.height;
        const cx = cv.getContext('2d');
        cx.drawImage(t.image, 0, 0);
        const id = cx.getImageData(0, 0, cv.width, cv.height);
        const px = id.data;
        for (let i = 0; i < px.length; i += 4) {
          px[i] = 255 - px[i];
          px[i + 1] = 255 - px[i + 1];
          px[i + 2] = 255 - px[i + 2];
        }
        cx.putImageData(id, 0, 0);
        earthMat.roughnessMap = new THREE.CanvasTexture(cv);
        earthMat.needsUpdate = true;
      },
      undefined,
      () => {}
    );
    loader.load(TEXTURES.bump, (t) => {
      earthMat.bumpMap = t;
      earthMat.bumpScale = 0.06;
      earthMat.needsUpdate = true;
    });


    // Data overlay sphere.
    const overlay = document.createElement('canvas');
    overlay.width = TEX_W;
    overlay.height = TEX_H;
    const octx = overlay.getContext('2d');
    overlayCtxRef.current = octx;
    geoPathRef.current = makeGeoPath(octx);

    paintOverlay({
      ctx: octx,
      geoPath: geoPathRef.current,
      geo,
      data,
      year: propsRef.current.year,
      variable: propsRef.current.variable,
      healthMetric: propsRef.current.healthMetric,
      selected: propsRef.current.selected,
    });
    const overlayTex = new THREE.CanvasTexture(overlay);
    overlayTex.colorSpace = THREE.SRGBColorSpace;
    overlayTex.minFilter = THREE.LinearFilter;
    overlayTex.magFilter = THREE.LinearFilter;
    overlayTex.generateMipmaps = false;
    overlayTexRef.current = overlayTex;
    const overlayMesh = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.001, 128, 128),
      new THREE.MeshStandardMaterial({
        map: overlayTex,
        transparent: true,
        depthWrite: false,
        roughness: 1.0,
        metalness: 0.0,
      })
    );
    worldGroup.add(overlayMesh);


    // VIIRS point cloud — one material shared across all years
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 64; glowCanvas.height = 64;
    const gc = glowCanvas.getContext('2d');
    const grad = gc.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0,    'rgba(255,255,255,1)');
    grad.addColorStop(0.25, 'rgba(255,255,255,0.8)');
    grad.addColorStop(0.6,  'rgba(255,255,255,0.2)');
    grad.addColorStop(1,    'rgba(255,255,255,0)');
    gc.fillStyle = grad;
    gc.fillRect(0, 0, 64, 64);
    const glowTex = new THREE.CanvasTexture(glowCanvas);

    const ptMat = new THREE.PointsMaterial({
      size: 0.07,
      map: glowTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      alphaTest: 0.01,
    });

    let pointsMesh = null;
    let alive = true;
    const LOG_NORM = Math.log(51);
    const PR = R * 1.003;

    const buildMesh = (floats) => {
      const n = floats.length / 3;
      const positions = new Float32Array(n * 3);
      const colors    = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const lon = floats[i * 3];
        const lat = floats[i * 3 + 1];
        const rad = floats[i * 3 + 2];
        const phi   = (90 - lat) * Math.PI / 180;
        const theta = (lon + 180) * Math.PI / 180;
        positions[i * 3]     = -PR * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] =  PR * Math.cos(phi);
        positions[i * 3 + 2] =  PR * Math.sin(phi) * Math.sin(theta);
        const t = Math.min(1, Math.log(rad + 1) / LOG_NORM);
        colors[i * 3]     = t;
        colors[i * 3 + 1] = t * 0.75;
        colors[i * 3 + 2] = t * 0.28;
      }
      const ptGeo = new THREE.BufferGeometry();
      ptGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      ptGeo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
      return new THREE.Points(ptGeo, ptMat);
    };

    const updateViirs = (yr) => {
      const floats = viirsDataRef.current[yr];
      if (!floats) return;
      if (pointsMesh) {
        worldGroup.remove(pointsMesh);
        pointsMesh.geometry.dispose();
        pointsMesh = null;
      }
      pointsMesh = buildMesh(floats);
      worldGroup.add(pointsMesh);
    };
    updateViirsRef.current = updateViirs;

    const YEARS = [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
    YEARS.forEach((yr) => {
      fetch(`${import.meta.env.BASE_URL}data/viirs_points_${yr}.bin`)
        .then((r) => r.arrayBuffer())
        .then((buf) => {
          if (!alive) return;
          viirsDataRef.current[yr] = new Float32Array(buf);
          if (yr === propsRef.current.year) updateViirs(yr);
        })
        .catch(() => {});
    });

    scene.add(new THREE.AmbientLight(0xffffff, 1.6));

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let idleTimer = null;
    const IDLE_MS = 3000;

    const startIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { autoRotateRef.current = true; }, IDLE_MS);
    };
    startIdleTimerRef.current = startIdleTimer;

    // Interaction.
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let downX = 0;
    let downY = 0;
    let downT = 0;
    let lastPinchDist = 0;

    const pickLatLon = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hit = raycaster.intersectObject(earth);
      if (!hit.length) return null;
      return vec3ToLatLon(earth.worldToLocal(hit[0].point.clone()));
    };

    const onDown = (e) => {
      isDragging = true;
      autoRotateRef.current = false;
      clearTimeout(idleTimer);
      prevX = e.clientX;
      prevY = e.clientY;
      downX = e.clientX;
      downY = e.clientY;
      downT = Date.now();
    };
    const onUp = (e) => {
      isDragging = false;
      startIdleTimer();
      const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      const dt = Date.now() - downT;
      if (dist < 5 && dt < 300) {
        const ll = pickLatLon(e);
        if (ll) {
          const name = countryAtLatLon(propsRef.current.geo, ll[0], ll[1]);
          if (name && propsRef.current.data.lookup[name]) propsRef.current.onSelect(name);
        }
      }
    };
    const onMove = (e) => {
      if (isDragging) {
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        worldGroup.rotation.y += dx * 0.005;
        worldGroup.rotation.x += dy * 0.005;
        worldGroup.rotation.x = Math.max(-1.2, Math.min(1.2, worldGroup.rotation.x));
        prevX = e.clientX;
        prevY = e.clientY;
      } else {
        const tip = tooltipRef.current;
        const ll = pickLatLon(e);
        canvas.style.cursor = isDragging ? 'grabbing' : 'grab';
        if (!ll) {
          tip.style.opacity = '0';
          return;
        }
        const name = countryAtLatLon(propsRef.current.geo, ll[0], ll[1]);
        if (!name) {
          tip.style.opacity = '0';
          return;
        }
        const { data, year, variable, healthMetric, t } = propsRef.current;
        const v = getVal(data.lookup, name, year, variable, healthMetric);
        const meta = VAR_META[activeVarKey(variable, healthMetric)];
        tip.style.opacity = '1';
        tip.style.left = e.clientX + 14 + 'px';
        tip.style.top = e.clientY + 14 + 'px';
        tip.innerHTML = `<div class="tt-name">${name}</div><div class="tt-val">${
          v == null ? t('common.noData') : fmt(v, activeVarKey(variable, healthMetric)) + ' ' + meta.unit
        }</div>`;
        canvas.style.cursor = 'pointer';
      }
    };
    const onWheel = (e) => {
      e.preventDefault();
      camera.position.z = Math.max(zMin, Math.min(zMax, camera.position.z + e.deltaY * 0.002));
      autoRotateRef.current = false;
      startIdleTimer();
    };

    // Touch handlers — drag and pinch-to-zoom.
    const onTouchStart = (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const t = e.touches[0];
        isDragging = true;
        autoRotateRef.current = false;
        clearTimeout(idleTimer);
        prevX = t.clientX; prevY = t.clientY;
        downX = t.clientX; downY = t.clientY;
        downT = Date.now();
      } else if (e.touches.length === 2) {
        isDragging = false;
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        lastPinchDist = Math.hypot(dx, dy);
      }
    };
    const onTouchMove = (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDragging) {
        const t = e.touches[0];
        worldGroup.rotation.y += (t.clientX - prevX) * 0.005;
        worldGroup.rotation.x += (t.clientY - prevY) * 0.005;
        worldGroup.rotation.x = Math.max(-1.2, Math.min(1.2, worldGroup.rotation.x));
        prevX = t.clientX; prevY = t.clientY;
      } else if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        const dist = Math.hypot(dx, dy);
        if (lastPinchDist > 0) {
          camera.position.z = Math.max(zMin, Math.min(zMax, camera.position.z + (lastPinchDist - dist) * 0.008));
          autoRotateRef.current = false;
        }
        lastPinchDist = dist;
      }
    };
    const onTouchEnd = (e) => {
      const t = e.changedTouches[0];
      isDragging = false;
      lastPinchDist = 0;
      startIdleTimer();
      const dist = Math.hypot(t.clientX - downX, t.clientY - downY);
      if (dist < 8 && Date.now() - downT < 400) {
        const ll = pickLatLon({ clientX: t.clientX, clientY: t.clientY });
        if (ll) {
          const name = countryAtLatLon(propsRef.current.geo, ll[0], ll[1]);
          if (name && propsRef.current.data.lookup[name]) propsRef.current.onSelect(name);
        }
      }
    };

    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      const newBaseZ = computeBaseZ(w / h);
      if (camera.position.z === baseZ) camera.position.z = newBaseZ;
      baseZ = newBaseZ;
      zMin = newBaseZ * 0.333;
      zMax = newBaseZ * 1.15;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      // Keep the loop alive (cheap) but skip the expensive rotation/render work
      // while the globe is hidden behind a full-screen mobile panel.
      if (propsRef.current.paused) return;
      if (autoRotateRef.current) worldGroup.rotation.y += 0.0007;
      renderer.render(scene, camera);
    };
    animate();

    // Expose for repaint from prop-change effects.
    sceneRef.current = { renderer, scene, camera, worldGroup, baseZ, earthMat };

    return () => {
      alive = false;
      if (pointsMesh) {
        worldGroup.remove(pointsMesh);
        pointsMesh.geometry.dispose();
        pointsMesh = null;
      }
      glowTex.dispose();
      ptMat.dispose();
      cancelAnimationFrame(raf);
      clearTimeout(idleTimer);
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, geo]);

  // Smooth camera zoom when switching between overview and country mode.
  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    const target = state.baseZ * zoomMult;
    const start  = state.camera.position.z;
    const dur    = 650;
    const t0     = performance.now();
    const ease   = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    let raf;
    const step = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      state.camera.position.z = start + (target - start) * ease(p);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [zoomMult]);

  // Repaint the choropleth whenever year / variable / selection changes.
  useEffect(() => {
    repaintOverlay();
  }, [year, variable, healthMetric, selected, compareCountry, repaintOverlay]);

  // Swap VIIRS point cloud when year changes.
  useEffect(() => {
    updateViirsRef.current?.(year);
  }, [year]);


  // Fly-to animation: rotate globe to center the selected country.
  useEffect(() => {
    if (!flyTo || !geo || !sceneRef.current) return;
    const centroid = getCountryCentroid(geo, flyTo);
    if (!centroid) return;
    const [lon, lat] = centroid;
    const targetRy = -Math.PI / 2 - lon * Math.PI / 180;
    const targetRx = Math.max(-1.2, Math.min(1.2, lat * Math.PI / 180));
    const { worldGroup } = sceneRef.current;
    autoRotateRef.current = false;
    const startRy = worldGroup.rotation.y;
    const startRx = worldGroup.rotation.x;
    let deltaY = targetRy - startRy;
    while (deltaY > Math.PI) deltaY -= 2 * Math.PI;
    while (deltaY < -Math.PI) deltaY += 2 * Math.PI;
    const dur = 1400;
    const t0 = performance.now();
    const ease = t => t < 0.5 ? 4*t*t*t : 1 - (-2*t+2)**3/2;
    let raf;
    const step = now => {
      const p = Math.min((now - t0) / dur, 1);
      const e = ease(p);
      worldGroup.rotation.y = startRy + deltaY * e;
      worldGroup.rotation.x = startRx + (targetRx - startRx) * e;
      if (p < 1) {
        raf = requestAnimationFrame(step);
      } else if (startIdleTimerRef.current) {
        startIdleTimerRef.current();
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [flyTo, geo]);

  return (
    <div ref={mountRef} className="globe-mount">
      <canvas ref={canvasRef} className="globe-canvas" />
      <div ref={tooltipRef} className="tooltip" />
    </div>
  );
}
