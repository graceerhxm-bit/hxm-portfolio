document.addEventListener('DOMContentLoaded', function () {
  (function () {
    let wrap = document.querySelector('.shader-bg');
    const hero = document.querySelector('.hero-section');
    const section3 =
      document.querySelector('.section-3') ||
      document.querySelector('[class*="section-3"]');

    if (!window.THREE || !hero || !section3) {
      console.warn('[Shader] 缺少 THREE、.hero-section 或 .section-3。');
      return;
    }

    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'shader-bg';
      const pageWrapper = document.querySelector('.page-wrapper');
      (pageWrapper || document.body).prepend(wrap);
    }

    wrap.querySelectorAll('canvas').forEach(function (canvas) {
      canvas.remove();
    });

    const params = {
      previewState: "状态 1",
      manualScroll: true,
      scrollProgress: 0,
      scrollSmoothing: 0.075,
      scrollDistance: 0.95,

      /* Shader 在 Section 3 中继续显示的比例；0.28 表示只覆盖前 28% */
      section3Coverage: 0.1,

      /* 起始色到终点色完成过渡的滚动进度；数值越小，变色越快 */
      colorTransitionEnd: 0.42,

      /*
        Shader 的颜色过渡完成后立即开始随页面向上离场。
        当前最终绿色在 colorTransitionEnd = 0.42 时已经完成，
        因此离场起点也设为 0.42，不再等待状态 4 的 0.72。
      */
      exitStartProgress: 0.42,

      hoverStrength: 0,

      angle1: 49.5,
      angle2: 73,
      angle3: 99.8,
      angle4: 104.4,

      anchor1X: 3,
      anchor1Y: 2,
      anchor2X: 3,
      anchor2Y: 2,
      anchor3X: 3,
      anchor3Y: 0.22,
      anchor4X: 3,
      anchor4Y: -0.29,

      width1: 3,
      width2: 3,
      width3: 1.93,
      width4: 2.43,

      height1: 3,
      height2: 2.57,
      height3: 2.68,
      height4: 3,

      offset1: 2,
      offset2: -0.14,
      offset3: 1.49,
      offset4: 2,

      edge1: 1.08,
      edge2: 0.32,
      edge3: 0.44,
      edge4: 1.5,

      reveal1X: -0.75, reveal1Y: 1.08, reveal1W: 7, reveal1H: 3.36, reveal1Feather: 0.16,
      reveal2X: 1.29, reveal2Y: 0.86, reveal2W: 7, reveal2H: 1.1, reveal2Feather: 0.518,
      reveal3X: -0.58, reveal3Y: 1.13, reveal3W: 6.43, reveal3H: 4, reveal3Feather: 0.2,
      reveal4X: 0.23, reveal4Y: 0.75, reveal4W: 5.3, reveal4H: 3.62, reveal4Feather: 0.2,

      entryAngle1: 67.6, entryOffset1: 0.39, entryFeather1: 0.614,
      entryAngle2: 82.2, entryOffset2: -0.67, entryFeather2: 0.256,
      entryAngle3: 106.7, entryOffset3: -0.01, entryFeather3: 0.28,
      entryAngle4: 121.3, entryOffset4: 0.07, entryFeather4: 0.321,

      noiseAmount: 0.516,
      noiseSpeed: 0.178,
      hoverWarp: 0.28,
      brightness: 1.51,

      highlightFlowSpeed: 0.515,
      highlightFlowScale: 0.48,
      highlightFlowStrength: 0.95,
      highlightFlowSoftness: 0.16,
      highlightAlphaMotion: 0,
      highlightPulseWidth: 0.18,
      highlightPulseLength: 0.52,
      highlightTailLength: 0.9,
      highlightTailStrength: 0.42,
      highlightIntervalRandomness: 0.62,

      scanlineIntensity: 0.,
      scanlineDensity: 1.85,
      scanlineSpeed: 2.2,

      grainIntensity: 0.055,
      grainSpeed: 85.0,
      grainFlicker: 0.32,

      rollingBandIntensity: 0.045,
      rollingBandSpeed: 0.22,
      rollingBandSize: 0.16
    };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    wrap.appendChild(renderer.domElement);

    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vPosition;

      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    
    `;

    const fragmentShader = `
      precision highp float;
      precision highp int;

      uniform float time;
      uniform float hover;
      uniform vec2 mouse;
      uniform float aspectRatio;
      uniform float scrollProgress;
      uniform float colorTransitionEnd;

      uniform vec4 angles;
      uniform vec4 anchorX;
      uniform vec4 anchorY;
      uniform vec4 widths;
      uniform vec4 heights;
      uniform vec4 offsets;
      uniform vec4 edges;
      uniform vec4 revealX;
      uniform vec4 revealY;
      uniform vec4 revealW;
      uniform vec4 revealH;
      uniform vec4 revealFeather;
      uniform vec4 entryAngles;
      uniform vec4 entryOffsets;
      uniform vec4 entryFeathers;

      uniform float noiseAmount;
      uniform float noiseSpeed;
      uniform float hoverWarp;
      uniform float brightness;
      uniform float highlightFlowSpeed;
      uniform float highlightFlowScale;
      uniform float highlightFlowStrength;
      uniform float highlightFlowSoftness;
      uniform float highlightAlphaMotion;
      uniform float highlightPulseWidth;
      uniform float highlightPulseLength;
      uniform float highlightTailLength;
      uniform float highlightTailStrength;
      uniform float highlightIntervalRandomness;

      uniform float scanlineIntensity;
      uniform float scanlineDensity;
      uniform float scanlineSpeed;

      uniform float grainIntensity;
      uniform float grainSpeed;
      uniform float grainFlicker;

      uniform float rollingBandIntensity;
      uniform float rollingBandSpeed;
      uniform float rollingBandSize;

      varying vec2 vUv;
      varying vec3 vPosition;

      float mod289(float x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }

      vec4 mod289(vec4 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }

      vec4 perm(vec4 x) {
        return mod289(((x * 34.0) + 1.0) * x);
      }

      float noise(vec3 p) {
        vec3 a = floor(p);
        vec3 d = p - a;
        d = d * d * (3.0 - 2.0 * d);
        vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
        vec4 k1 = perm(b.xyxy);
        vec4 k2 = perm(k1.xyxy + b.zzww);
        vec4 c = k2 + a.zzzz;
        vec4 k3 = perm(c);
        vec4 k4 = perm(c + 1.0);
        vec4 o1 = fract(k3 * (1.0 / 41.0));
        vec4 o2 = fract(k4 * (1.0 / 41.0));
        vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
        vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);
        return o4.y * d.y + o4.x * (1.0 - d.y);
      }

      float lines(vec2 uv, float offset, float scale) {
        return smoothstep(
          0.0,
          0.5 + offset * 0.5,
          abs(0.5 * (sin(uv.x * 2.4 * scale) + offset * 2.0))
        );
      }

      mat2 rotate2D(float angle) {
        return mat2(
          cos(angle), -sin(angle),
          sin(angle),  cos(angle)
        );
      }

      float smootherstep01(float x) {
        x = clamp(x, 0.0, 1.0);
        return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
      }

      float stageProgress(float value, float startValue, float endValue) {
        return smootherstep01((value - startValue) / max(endValue - startValue, 0.0001));
      }

      float softBoxMask(vec2 p, vec2 center, vec2 halfSize, float feather) {
        vec2 d = abs(p - center) - halfSize;
        float outside = max(d.x, d.y);
        return 1.0 - smoothstep(0.0, max(feather, 0.0001), outside);
      }

      float directionalReveal(vec2 p, float angle, float offset, float feather) {
        vec2 normal = vec2(cos(angle), sin(angle));
        float d = dot(p, normal) - offset;
        return smoothstep(-max(feather, 0.0001), max(feather, 0.0001), d);
      }

      void main() {
        vec3 position = vPosition;

        /*
          柔和的大范围鼠标扰动：
          中心区域保持平滑，不绘制尖点；
          外围使用宽范围推开和较大的涟漪形变。
        */
        vec2 mouseDelta = vUv - mouse;
        mouseDelta.x *= aspectRatio;

        float mouseDistance = length(mouseDelta);

        /* 扰动半径扩大，边缘采用柔和衰减。 */
        float mouseFalloff =
          1.0 - smoothstep(0.10, 0.58, mouseDistance);

        /*
          中心消隐：鼠标正中心不产生方向性位移，
          避免 normalize 后形成尖锐凹点或针状效果。
        */
        float centerFade = smoothstep(0.025, 0.16, mouseDistance);

        vec2 mouseDirection =
          mouseDelta / max(mouseDistance, 0.08);

        /* 更宽、更慢的涟漪，不再集中成一个小尖点。 */
        float mouseRipple =
          sin(mouseDistance * 22.0 - time * 5.2) *
          exp(-mouseDistance * 3.8);

        /* 大范围向外推开。 */
        float pushAmount =
          mouseFalloff *
          centerFade *
          hover *
          0.24;

        /* 宽涟漪叠加在推开效果上。 */
        float rippleAmount =
          mouseFalloff *
          centerFade *
          hover *
          mouseRipple *
          hoverWarp;

        position.xy +=
          mouseDirection *
          (pushAmount + rippleAmount);

        /*
          再加入一层柔和横向剪切，让整片波纹弯曲，
          而不是只在鼠标中心形成圆形凹陷。
        */
        position.x +=
          mouseDelta.y *
          mouseFalloff *
          hover *
          0.18;

        position.y -=
          mouseDelta.x *
          mouseFalloff *
          hover *
          0.12;

        float noiseProgress = smootherstep01(min(scrollProgress / 0.72, 1.0));
        float noiseScale = mix(0.72, 0.58, noiseProgress);
        float n = noise(position * noiseScale + time * noiseSpeed);
        float shine = noise(position * 0.15 + time * 0.27 + 100.0);

        vec3 background = vec3(0.0392, 0.0392, 0.0706);

        /*
          起点：紫蓝 + 粉红
          终点：青蓝 + 柔和黄绿
          颜色在前 72% 滚动内完成，并固定在终点色，不再继续偏白。
        */
        vec3 purpleStart = vec3(0.54, 0.51, 0.93);
        vec3 pinkStart   = vec3(1.00, 0.38, 0.45);

        vec3 purpleEnd = vec3(0.46, 0.76, 0.72);
        vec3 pinkEnd   = vec3(0.84, 0.88, 0.48);

        float colorProgress = smootherstep01(
          min(scrollProgress / max(colorTransitionEnd, 0.001), 1.0)
        );

        vec3 purple = mix(purpleStart, purpleEnd, colorProgress);
        vec3 pink   = mix(pinkStart, pinkEnd, colorProgress);

        /*
          压缩后的运动节奏：
          0.00：状态 1
          0.16：快速展开到自动生成的过渡状态
          0.42：进入状态 3
          0.72：进入状态 4
          0.72 之后只保留轻微内部流动，不再继续大幅变形。
        */
        float compressedScroll = min(scrollProgress / 0.72, 1.0);
        float stage12 = stageProgress(compressedScroll, 0.00, 0.22);
        float stage23 = stageProgress(compressedScroll, 0.22, 0.58);
        float stage34 = stageProgress(compressedScroll, 0.58, 1.00);

        float autoAngle2 = mix(angles.x, angles.z, 0.42);
        float bandAngle = mix(angles.x, autoAngle2, stage12);
        bandAngle = mix(bandAngle, angles.z, stage23);
        bandAngle = mix(bandAngle, angles.w, stage34);

        vec2 anchor1 = vec2(anchorX.x, anchorY.x);
        vec2 anchor2 = mix(anchor1, vec2(anchorX.z, anchorY.z), 0.42);
        vec2 anchor3 = vec2(anchorX.z, anchorY.z);
        vec2 anchor4 = vec2(anchorX.w, anchorY.w);

        vec2 anchor = mix(anchor1, anchor2, stage12);
        anchor = mix(anchor, anchor3, stage23);
        anchor = mix(anchor, anchor4, stage34);

        float autoWidth2 = mix(widths.x, widths.z, 0.42);
        float widthScale = mix(widths.x, autoWidth2, stage12);
        widthScale = mix(widthScale, widths.z, stage23);
        widthScale = mix(widthScale, widths.w, stage34);

        float autoHeight2 = mix(heights.x, heights.z, 0.42);
        float heightScale = mix(heights.x, autoHeight2, stage12);
        heightScale = mix(heightScale, heights.z, stage23);
        heightScale = mix(heightScale, heights.w, stage34);

        vec2 localPosition = vec2(
          (position.x - anchor.x) * widthScale,
          (position.y - anchor.y) * heightScale
        );

        float distortionStrength = mix(noiseAmount * 1.18, noiseAmount * 0.72, noiseProgress);

        vec2 baseUV = rotate2D(
          bandAngle + n * distortionStrength
        ) * localPosition;

        float autoOffset2 = mix(offsets.x, offsets.z, 0.42);
        float maskOffset = mix(offsets.x, autoOffset2, stage12);
        maskOffset = mix(maskOffset, offsets.z, stage23);
        maskOffset = mix(maskOffset, offsets.w, stage34);

        vec2 mask = vec2(
          baseUV.x,
          baseUV.y + maskOffset
        );

        float basePattern = lines(baseUV, 0.5, 1.1);
        float secondPattern = lines(baseUV, 0.1, 1.1);
        secondPattern = mix(
          secondPattern,
          1.0,
          clamp(0.2 - mask.y, 0.0, 1.0)
        );

        vec3 baseColor = mix(purple, pink, basePattern);
        vec3 finalColor = mix(baseColor, background, secondPattern);

        /*
          高光在已经形变后的 baseUV 坐标中计算，
          因此它会贴着波纹一起弯曲，而不是独立覆盖在画面上。
        */
        float highlightStrength = mix(brightness * 1.18, brightness * 0.42, noiseProgress);
        float highlightMask = smoothstep(0.16, 0.82, shine);

        /*
          高光路径位置完全沿用上一版的 highlightMask。
          穿行窗口改为使用屏幕横向 position.x：
          高光只会从屏幕左侧向右侧移动，不再沿 baseUV.x 横扫整片波纹。
        */
        float screenPath = position.x * highlightFlowScale;

        float irregularClock =
          time * highlightFlowSpeed +
          sin(time * 0.37) * highlightIntervalRandomness +
          sin(time * 0.13 + 1.7) * highlightIntervalRandomness * 0.55;

        float cycle = floor(irregularClock);
        float phase = fract(irregularClock);

        float randomGate = fract(
          sin((cycle + 3.17) * 12.9898) * 43758.5453
        );

        float pulseEnabled = step(
          0.34 + highlightIntervalRandomness * 0.25,
          randomGate
        );

        /* 从屏幕左侧向右侧快速穿行 */
        float pulseCenter = mix(-3.7, 3.7, phase);
        float pulseDistance = screenPath - pulseCenter;

        /*
          高光长度：把单点高光扩展成一段沿横向穿行的亮带。
          highlightPulseLength 越大，高光主体越长。
        */
        float halfPulseLength = max(highlightPulseLength * 0.5, 0.001);
        float pulseBodyDistance = max(
          abs(pulseDistance) - halfPulseLength,
          0.0
        );

        float pulseHead = exp(
          -pulseBodyDistance * pulseBodyDistance /
          max(highlightPulseWidth * highlightPulseWidth, 0.0001)
        );

        /*
          拖尾位于移动方向后方：
          highlightTailLength 控制拖尾长度，
          highlightTailStrength 控制拖尾亮度。
        */
        float tailDistance = max(-pulseDistance - halfPulseLength, 0.0);
        float pulseTail = exp(
          -tailDistance / max(highlightTailLength, 0.001)
        ) * step(pulseDistance, -halfPulseLength);

        float eventFade =
          smoothstep(0.02, 0.10, phase) *
          (1.0 - smoothstep(0.88, 0.99, phase));

        float flowingHighlight = clamp(
          (pulseHead + pulseTail * highlightTailStrength) *
          pulseEnabled *
          eventFade,
          0.0,
          1.0
        );

        /*
          highlightMask 仍负责原有高光路径；
          flowingHighlight 只是一扇从左向右移动的亮度窗口。
        */
        float combinedHighlight =
          highlightMask *
          flowingHighlight *
          highlightFlowStrength;

        finalColor *= 1.0 + combinedHighlight * highlightStrength;

        /* 末端压住高光，避免黄绿色波纹出现大面积白色过曝 */
        float endExposureControl = mix(1.0, 0.82, noiseProgress);
        finalColor *= endExposureControl;

        float autoEdge2 = mix(edges.x, edges.z, 0.42);
        float edgeFade = mix(edges.x, autoEdge2, stage12);
        edgeFade = mix(edgeFade, edges.z, stage23);
        edgeFade = mix(edgeFade, edges.w, stage34);

        float autoRevealX2 = mix(revealX.x, revealX.z, 0.42);
        float revealCenterX = mix(revealX.x, autoRevealX2, stage12);
        revealCenterX = mix(revealCenterX, revealX.z, stage23);
        revealCenterX = mix(revealCenterX, revealX.w, stage34);

        float autoRevealY2 = mix(revealY.x, revealY.z, 0.42);
        float revealCenterY = mix(revealY.x, autoRevealY2, stage12);
        revealCenterY = mix(revealCenterY, revealY.z, stage23);
        revealCenterY = mix(revealCenterY, revealY.w, stage34);

        float autoRevealW2 = mix(revealW.x, revealW.z, 0.42);
        float revealWidth = mix(revealW.x, autoRevealW2, stage12);
        revealWidth = mix(revealWidth, revealW.z, stage23);
        revealWidth = mix(revealWidth, revealW.w, stage34);

        float autoRevealH2 = mix(revealH.x, revealH.z, 0.42);
        float revealHeight = mix(revealH.x, autoRevealH2, stage12);
        revealHeight = mix(revealHeight, revealH.z, stage23);
        revealHeight = mix(revealHeight, revealH.w, stage34);

        float autoRevealFeather2 = mix(revealFeather.x, revealFeather.z, 0.42);
        float feather = mix(revealFeather.x, autoRevealFeather2, stage12);
        feather = mix(feather, revealFeather.z, stage23);
        feather = mix(feather, revealFeather.w, stage34);

        float regionMask = softBoxMask(
          position.xy,
          vec2(revealCenterX, revealCenterY),
          vec2(revealWidth, revealHeight) * 0.5,
          feather
        );

        float autoEntryAngle2 = mix(entryAngles.x, entryAngles.z, 0.42);
        float entryAngle = mix(entryAngles.x, autoEntryAngle2, stage12);
        entryAngle = mix(entryAngle, entryAngles.z, stage23);
        entryAngle = mix(entryAngle, entryAngles.w, stage34);

        float autoEntryOffset2 = mix(entryOffsets.x, entryOffsets.z, 0.42);
        float entryOffset = mix(entryOffsets.x, autoEntryOffset2, stage12);
        entryOffset = mix(entryOffset, entryOffsets.z, stage23);
        entryOffset = mix(entryOffset, entryOffsets.w, stage34);

        float autoEntryFeather2 = mix(entryFeathers.x, entryFeathers.z, 0.42);
        float entryFeather = mix(entryFeathers.x, autoEntryFeather2, stage12);
        entryFeather = mix(entryFeather, entryFeathers.z, stage23);
        entryFeather = mix(entryFeather, entryFeathers.w, stage34);

        float entryMask = directionalReveal(
          position.xy,
          entryAngle,
          entryOffset,
          entryFeather
        );

        float alpha = clamp(mask.y + edgeFade, 0.0, 1.0) * regionMask * entryMask;

        /* 高光只改变亮度，不改变透明度。 */
        alpha = clamp(alpha, 0.0, 1.0);

        /* 横向扫描线持续向上缓慢移动 */
        float scanlineWave =
          sin(
            gl_FragCoord.y * scanlineDensity -
            time * scanlineSpeed
          ) * 0.5 + 0.5;

        float scanline = mix(
          1.0 - scanlineIntensity,
          1.0 + scanlineIntensity,
          scanlineWave
        );

        /* 高频颗粒持续变化，并带轻微电视雪花闪烁 */
        float grainSeed = time * grainSpeed;

        float grain = fract(
          sin(
            dot(
              gl_FragCoord.xy + grainSeed,
              vec2(12.9898, 78.233)
            )
          ) * 43758.5453
        );

        float flicker =
          1.0 +
          sin(time * 17.0) * grainFlicker * 0.18 +
          sin(time * 31.0 + 1.7) * grainFlicker * 0.10;

        grain = (grain - 0.5) * grainIntensity * flicker;

        /* 一条很宽、很柔的亮暗带像旧电视刷新一样滚动 */
        float rollingPosition = fract(
          time * rollingBandSpeed
        );

        float rollingDistance = abs(
          vUv.y - rollingPosition
        );

        rollingDistance = min(
          rollingDistance,
          1.0 - rollingDistance
        );

        float rollingBand = 1.0 - smoothstep(
          0.0,
          rollingBandSize,
          rollingDistance
        );

        float rollingLight = mix(
          1.0,
          1.0 + rollingBandIntensity,
          rollingBand
        );

        finalColor *= scanline;
        finalColor *= rollingLight;
        finalColor += grain;
        finalColor = max(finalColor, vec3(0.0));

        gl_FragColor = vec4(finalColor, alpha);
      }
    
    `;

    const uniforms = {
      time: { value: 0 },
      hover: { value: 0 },
      mouse: { value: new THREE.Vector2(0.5, 0.5) },
      aspectRatio: { value: 1 },
      scrollProgress: { value: 0 },
      colorTransitionEnd: { value: params.colorTransitionEnd },
      angles: { value: new THREE.Vector4() },
      anchorX: { value: new THREE.Vector4() },
      anchorY: { value: new THREE.Vector4() },
      widths: { value: new THREE.Vector4() },
      heights: { value: new THREE.Vector4() },
      offsets: { value: new THREE.Vector4() },
      edges: { value: new THREE.Vector4() },
      revealX: { value: new THREE.Vector4() },
      revealY: { value: new THREE.Vector4() },
      revealW: { value: new THREE.Vector4() },
      revealH: { value: new THREE.Vector4() },
      revealFeather: { value: new THREE.Vector4() },
      entryAngles: { value: new THREE.Vector4() },
      entryOffsets: { value: new THREE.Vector4() },
      entryFeathers: { value: new THREE.Vector4() },
      noiseAmount: { value: params.noiseAmount },
      noiseSpeed: { value: params.noiseSpeed },
      hoverWarp: { value: params.hoverWarp },
      brightness: { value: params.brightness },
      highlightFlowSpeed: { value: params.highlightFlowSpeed },
      highlightFlowScale: { value: params.highlightFlowScale },
      highlightFlowStrength: { value: params.highlightFlowStrength },
      highlightFlowSoftness: { value: params.highlightFlowSoftness },
      highlightAlphaMotion: { value: params.highlightAlphaMotion },
      highlightPulseWidth: { value: params.highlightPulseWidth },
      highlightPulseLength: { value: params.highlightPulseLength },
      highlightTailLength: { value: params.highlightTailLength },
      highlightTailStrength: { value: params.highlightTailStrength },
      highlightIntervalRandomness: { value: params.highlightIntervalRandomness },

      scanlineIntensity: { value: params.scanlineIntensity },
      scanlineDensity: { value: params.scanlineDensity },
      scanlineSpeed: { value: params.scanlineSpeed },

      grainIntensity: { value: params.grainIntensity },
      grainSpeed: { value: params.grainSpeed },
      grainFlicker: { value: params.grainFlicker },

      rollingBandIntensity: { value: params.rollingBandIntensity },
      rollingBandSpeed: { value: params.rollingBandSpeed },
      rollingBandSize: { value: params.rollingBandSize }
    };

    function syncUniforms() {
      uniforms.colorTransitionEnd.value = params.colorTransitionEnd;
      uniforms.angles.value.set(
        THREE.MathUtils.degToRad(params.angle1),
        THREE.MathUtils.degToRad(params.angle2),
        THREE.MathUtils.degToRad(params.angle3),
        THREE.MathUtils.degToRad(params.angle4)
      );
      uniforms.anchorX.value.set(params.anchor1X, params.anchor2X, params.anchor3X, params.anchor4X);
      uniforms.anchorY.value.set(params.anchor1Y, params.anchor2Y, params.anchor3Y, params.anchor4Y);
      uniforms.widths.value.set(params.width1, params.width2, params.width3, params.width4);
      uniforms.heights.value.set(params.height1, params.height2, params.height3, params.height4);
      uniforms.offsets.value.set(params.offset1, params.offset2, params.offset3, params.offset4);
      uniforms.edges.value.set(params.edge1, params.edge2, params.edge3, params.edge4);
      uniforms.revealX.value.set(params.reveal1X, params.reveal2X, params.reveal3X, params.reveal4X);
      uniforms.revealY.value.set(params.reveal1Y, params.reveal2Y, params.reveal3Y, params.reveal4Y);
      uniforms.revealW.value.set(params.reveal1W, params.reveal2W, params.reveal3W, params.reveal4W);
      uniforms.revealH.value.set(params.reveal1H, params.reveal2H, params.reveal3H, params.reveal4H);
      uniforms.revealFeather.value.set(
        params.reveal1Feather, params.reveal2Feather, params.reveal3Feather, params.reveal4Feather
      );
      uniforms.entryAngles.value.set(
        THREE.MathUtils.degToRad(params.entryAngle1),
        THREE.MathUtils.degToRad(params.entryAngle2),
        THREE.MathUtils.degToRad(params.entryAngle3),
        THREE.MathUtils.degToRad(params.entryAngle4)
      );
      uniforms.entryOffsets.value.set(
        params.entryOffset1, params.entryOffset2, params.entryOffset3, params.entryOffset4
      );
      uniforms.entryFeathers.value.set(
        params.entryFeather1, params.entryFeather2, params.entryFeather3, params.entryFeather4
      );
      uniforms.noiseAmount.value = params.noiseAmount;
      uniforms.noiseSpeed.value = params.noiseSpeed;
      uniforms.hoverWarp.value = params.hoverWarp;
      uniforms.brightness.value = params.brightness;
      uniforms.highlightFlowSpeed.value = params.highlightFlowSpeed;
      uniforms.highlightFlowScale.value = params.highlightFlowScale;
      uniforms.highlightFlowStrength.value = params.highlightFlowStrength;
      uniforms.highlightFlowSoftness.value = params.highlightFlowSoftness;
      uniforms.highlightAlphaMotion.value = params.highlightAlphaMotion;
      uniforms.highlightPulseWidth.value = params.highlightPulseWidth;
      uniforms.highlightPulseLength.value = params.highlightPulseLength;
      uniforms.highlightTailLength.value = params.highlightTailLength;
      uniforms.highlightTailStrength.value = params.highlightTailStrength;
      uniforms.highlightIntervalRandomness.value = params.highlightIntervalRandomness;

      uniforms.scanlineIntensity.value = params.scanlineIntensity;
      uniforms.scanlineDensity.value = params.scanlineDensity;
      uniforms.scanlineSpeed.value = params.scanlineSpeed;

      uniforms.grainIntensity.value = params.grainIntensity;
      uniforms.grainSpeed.value = params.grainSpeed;
      uniforms.grainFlicker.value = params.grainFlicker;

      uniforms.rollingBandIntensity.value = params.rollingBandIntensity;
      uniforms.rollingBandSpeed.value = params.rollingBandSpeed;
      uniforms.rollingBandSize.value = params.rollingBandSize;
    }

    syncUniforms();

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending
    });

    const geometry = new THREE.PlaneGeometry(6, 3.8, 24, 20);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.z = -0.08;
    scene.add(mesh);

    function resize() {
      const width = Math.max(wrap.offsetWidth, 1);
      const height = Math.max(wrap.offsetHeight, 1);

      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      uniforms.aspectRatio.value = width / height;

      /*
        按相机实际可视范围计算 Plane 的统一缩放。
        同时把 mesh.rotation.z 带来的四角外扩计算进去，
        确保旋转后的 Shader 仍完整覆盖整个视口，不再出现右上角缺口。
        这里只做等比放大，不改变 Shader 图案比例，也不拉伸画面。
      */
      const cameraDistance = Math.abs(camera.position.z - mesh.position.z);
      const visibleHeight =
        2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * cameraDistance;
      const visibleWidth = visibleHeight * camera.aspect;

      const planeWidth = 6;
      const planeHeight = 3.8;
      const rotation = Math.abs(mesh.rotation.z);
      const cosR = Math.abs(Math.cos(rotation));
      const sinR = Math.abs(Math.sin(rotation));

      const scaleForWidth =
        (visibleWidth * cosR + visibleHeight * sinR) / planeWidth;
      const scaleForHeight =
        (visibleWidth * sinR + visibleHeight * cosR) / planeHeight;

      /* 额外保留 8% 安全区，避免不同 DPR 和浏览器取整造成 1px 缝隙。 */
      const coverScale = Math.max(scaleForWidth, scaleForHeight) * 1.08;

      mesh.scale.set(coverScale, coverScale, 1);
    }

    let targetScroll = 0;
    let currentScroll = 0;

    function getDocumentTop(element) {
      return element.getBoundingClientRect().top + window.scrollY;
    }

    function updateScrollProgress() {
      const startY = getDocumentTop(hero);
      const endY =
        getDocumentTop(section3) +
        section3.offsetHeight * params.section3Coverage;

      const distance = Math.max(endY - startY, 1);

      targetScroll = THREE.MathUtils.clamp(
        (window.scrollY - startY) / distance,
        0,
        1
      );

      /*
        前半段 Shader 保持 fixed，完整展示颜色和形态变化。
        最终绿色出现后，不再移动整个 Canvas 容器，而是在 WebGL 场景中
        把 Shader 平面向“左上方”移动。

        原因：
        只把整个 Canvas 向上移动时，绿色波纹本身是斜向的，
        进入视口的切片会逐渐向右收缩，于是左侧边缘会脱离屏幕。
        离场时同步向左补偿，可以让绿色波纹左侧持续延伸到屏幕外，
        同时仍然保持整体向上离场。
      */
      const exitStartY =
        startY + distance * params.exitStartProgress;

      const exitDistance = Math.max(
        window.scrollY - exitStartY,
        0
      );

      const viewportHeight = Math.max(window.innerHeight, 1);
      const viewportWidth = Math.max(window.innerWidth, 1);
      const exitRatio = exitDistance / viewportHeight;

      const cameraDistance = Math.abs(camera.position.z - mesh.position.z);
      const visibleHeight =
        2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * cameraDistance;
      const visibleWidth = visibleHeight * camera.aspect;

      /*
        Y：按滚动距离向上移动。
        X：按 0.32 的比例向左补偿，防止斜向波纹左边缘收进去。
        只移动 Mesh，不移动 Canvas，因此不会露出 Canvas 空白边。
      */
      mesh.position.y = exitRatio * visibleHeight;
      mesh.position.x = -exitRatio * visibleWidth * 0.32;

      wrap.style.transform = '';
      wrap.style.willChange = 'auto';
      wrap.style.pointerEvents = 'none';

      /* 不再使用突然隐藏，离场完全由 Mesh 位移完成。 */
      wrap.classList.remove('is-hidden');
    }

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', function () {
      resize();
      updateScrollProgress();
    });

    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(wrap);
    }

    resize();
    updateScrollProgress();

    /* =========================
       SHADER MOUSE DISTURBANCE
    ========================= */
    const targetMouse = new THREE.Vector2(0.5, 0.5);
    const currentMouse = new THREE.Vector2(0.5, 0.5);
    let targetHover = 0;
    let currentHover = 0;

    function isPointerInsideElement(element, clientX, clientY) {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      );
    }

    function updateShaderPointer(event) {
      const rect = wrap.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      targetMouse.x = THREE.MathUtils.clamp(
        (event.clientX - rect.left) / rect.width,
        0,
        1
      );

      targetMouse.y = THREE.MathUtils.clamp(
        1 - (event.clientY - rect.top) / rect.height,
        0,
        1
      );

      const insideShaderArea =
        isPointerInsideElement(hero, event.clientX, event.clientY) ||
        isPointerInsideElement(section3, event.clientX, event.clientY);

      targetHover = insideShaderArea ? 1 : 0;
    }

    window.addEventListener('pointermove', updateShaderPointer, { passive: true });
    window.addEventListener('pointerleave', function () {
      targetHover = 0;
    });

    const clock = new THREE.Clock();

    window.__heroShaderDebug = {
      params: params,
      uniforms: uniforms,
      renderer: renderer,
      mesh: mesh,
      setProgress: function (value) {
        const progress = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
        targetScroll = progress;
        currentScroll = progress;
        uniforms.scrollProgress.value = progress;
        mesh.position.set(0, 0, 0);
        wrap.style.transform = '';
        wrap.classList.remove('is-hidden');
        renderer.render(scene, camera);
        console.log('[Shader debug] progress =', progress);
      },
      state1: function () { this.setProgress(0); },
      state3: function () { this.setProgress(0.42); },
      state4: function () { this.setProgress(0.72); },
      resume: function () {
        updateScrollProgress();
        console.log('[Shader debug] resumed scroll control');
      }
    };

    console.log('[Shader] verified exported shader loaded', params);

    function animate() {
      requestAnimationFrame(animate);

      currentScroll +=
        (targetScroll - currentScroll) *
        params.scrollSmoothing;

      uniforms.scrollProgress.value = currentScroll;

      currentMouse.lerp(targetMouse, 0.12);
      currentHover += (targetHover - currentHover) * 0.09;

      uniforms.mouse.value.copy(currentMouse);
      uniforms.hover.value = currentHover;
      uniforms.time.value = clock.getElapsedTime();

      syncUniforms();
      renderer.render(scene, camera);
    }

    animate();
  })();
});
