import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
const ThreeJsRecorder = ({ data, onComplete, onError }) => {
  const canvasRef = useRef(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!data || !canvasRef.current) return;
    let isUnmounted = false;
    let renderer = null;
    let recorder = null;
    let frameId = null;
    const run = async () => {
      console.log("Initializing Recorder for data:", data);
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(5592405, 2e-3);
      scene.background = new THREE.Color(328965);
      const width = 1280;
      const height = 720;
      const fps = 30;
      const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1e3);
      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        preserveDrawingBuffer: true
      });
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = true;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      const loader = new THREE.TextureLoader();
      const loadTex = (url) => new Promise((res) => loader.load(url, res, void 0, () => res(null)));
      const [concreteTex, metalTex, skyboxTex] = await Promise.all([
        loadTex("concrete.png"),
        loadTex("metal_floor.png"),
        loadTex("skybox.png")
      ]);
      if (isUnmounted) {
        renderer.dispose();
        return;
      }
      if (skyboxTex) {
        skyboxTex.mapping = THREE.EquirectangularReflectionMapping;
        skyboxTex.colorSpace = THREE.SRGBColorSpace;
        scene.background = skyboxTex;
        scene.environment = skyboxTex;
      }
      const ambientLight = new THREE.AmbientLight(4210752, 2);
      scene.add(ambientLight);
      const dirLight = new THREE.DirectionalLight(16777215, 2);
      dirLight.position.set(100, 500, 100);
      dirLight.castShadow = true;
      dirLight.shadow.bias = -5e-4;
      dirLight.shadow.camera.top = 200;
      dirLight.shadow.camera.bottom = -200;
      dirLight.shadow.camera.left = -200;
      dirLight.shadow.camera.right = 200;
      scene.add(dirLight);
      if (concreteTex) {
        concreteTex.wrapS = concreteTex.wrapT = THREE.RepeatWrapping;
        concreteTex.colorSpace = THREE.SRGBColorSpace;
      }
      if (metalTex) {
        metalTex.wrapS = metalTex.wrapT = THREE.RepeatWrapping;
        metalTex.colorSpace = THREE.SRGBColorSpace;
      }
      const towerGeo = new THREE.BoxGeometry(40, 300, 40);
      const uvAttribute = towerGeo.attributes.uv;
      for (let i = 0; i < uvAttribute.count; i++) {
        uvAttribute.setXY(i, uvAttribute.getX(i) * 4, uvAttribute.getY(i) * 30);
      }
      const towerMat = new THREE.MeshStandardMaterial({
        map: concreteTex,
        color: concreteTex ? 16777215 : 6710886,
        roughness: 0.8
      });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(0, 150, 0);
      tower.castShadow = true;
      tower.receiveShadow = true;
      scene.add(tower);
      const roofGeo = new THREE.BoxGeometry(42, 1, 42);
      const roofMat = new THREE.MeshStandardMaterial({
        map: metalTex,
        color: metalTex ? 16777215 : 3355443,
        roughness: 0.6
      });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(0, 300.5, 0);
      roof.castShadow = true;
      roof.receiveShadow = true;
      scene.add(roof);
      const wallMat = new THREE.MeshStandardMaterial({ color: 4473924, roughness: 0.9 });
      const wallGeoH = new THREE.BoxGeometry(42, 1.5, 1);
      const wallGeoV = new THREE.BoxGeometry(1, 1.5, 42);
      const w1 = new THREE.Mesh(wallGeoH, wallMat);
      w1.position.set(0, 301.25, 20.5);
      const w2 = new THREE.Mesh(wallGeoH, wallMat);
      w2.position.set(0, 301.25, -20.5);
      const w3 = new THREE.Mesh(wallGeoV, wallMat);
      w3.position.set(20.5, 301.25, 0);
      const w4 = new THREE.Mesh(wallGeoV, wallMat);
      w4.position.set(-20.5, 301.25, 0);
      scene.add(w1, w2, w3, w4);
      const rnd = /* @__PURE__ */ (() => {
        let seed = 5678;
        return () => {
          seed = (Math.floor(seed) * 9301 + 49297) % 233280;
          return seed / 233280;
        };
      })();
      for (let i = 0; i < 20; i++) {
        const h = 50 + rnd() * 200;
        const w = 20 + rnd() * 30;
        const x = (rnd() - 0.5) * 500;
        const z = (rnd() - 0.5) * 500;
        if (Math.abs(x) < 50 && Math.abs(z) < 50) continue;
        const b = new THREE.Mesh(
          new THREE.BoxGeometry(w, h, w),
          new THREE.MeshStandardMaterial({ color: 3355443 })
        );
        b.position.set(x, h / 2, z);
        b.castShadow = true;
        b.receiveShadow = true;
        scene.add(b);
      }
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(1e3, 1e3),
        new THREE.MeshStandardMaterial({ color: 1052688 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);
      const ghostMat = new THREE.MeshBasicMaterial({ color: 65280, wireframe: true });
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), ghostMat);
      const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.15), ghostMat);
      const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.15), ghostMat);
      scene.add(head, lHand, rHand);
      renderer.render(scene, camera);
      const chunks = [];
      try {
        const stream = canvasRef.current.captureStream(fps);
        if (window.player && window.player.audio) {
          try {
            const audioStream = window.player.audio.getStream();
            if (audioStream) {
              audioStream.getAudioTracks().forEach((track) => stream.addTrack(track));
            }
          } catch (e) {
            console.warn("Could not attach audio stream", e);
          }
        }
        const mimeTypes = ["video/webm;codecs=vp9", "video/webm", "video/mp4"];
        const selectedType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || "";
        recorder = new MediaRecorder(stream, selectedType ? { mimeType: selectedType, videoBitsPerSecond: 8e6 } : {});
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: selectedType || "video/webm" });
          if (blob.size < 1e3) {
            if (!isUnmounted) onError("Video empty (Blob < 1KB)");
          } else {
            const url = URL.createObjectURL(blob);
            if (!isUnmounted) onComplete(url);
          }
        };
      } catch (e) {
        console.error("Recorder Setup Error:", e);
        if (!isUnmounted) onError(e.message);
        return;
      }
      let startTime = null;
      const totalDuration = data.duration + 500;
      let isRecording = false;
      const animate = (timestamp) => {
        if (isUnmounted) return;
        if (!startTime) {
          startTime = timestamp;
          if (recorder && recorder.state === "inactive") {
            recorder.start();
            isRecording = true;
          }
        }
        const elapsed = timestamp - startTime;
        const progressVal = Math.min(1, elapsed / totalDuration);
        setProgress(progressVal);
        window.dispatchEvent(new CustomEvent("render-progress", { detail: { progress: progressVal } }));
        if (elapsed >= totalDuration) {
          if (recorder && recorder.state === "recording") {
            recorder.stop();
          }
          return;
        }
        if (data.frames && data.frames.length > 0) {
          let closestFrame = data.frames[0];
          let minDiff = Math.abs(closestFrame.t - elapsed);
          for (let i = 0; i < data.frames.length; i++) {
            const diff = Math.abs(data.frames[i].t - elapsed);
            if (diff < minDiff) {
              minDiff = diff;
              closestFrame = data.frames[i];
            }
          }
          const [hPos, hRot] = closestFrame.h;
          const [lPos, lRot] = closestFrame.l;
          const [rPos, rRot] = closestFrame.r;
          head.position.fromArray(hPos);
          head.quaternion.fromArray(hRot);
          lHand.position.fromArray(lPos);
          lHand.quaternion.fromArray(lRot);
          rHand.position.fromArray(rPos);
          rHand.quaternion.fromArray(rRot);
          const tPos = new THREE.Vector3().fromArray(hPos);
          const tRot = new THREE.Quaternion().fromArray(hRot);
          const offset = new THREE.Vector3(0, 0.5, 2).applyQuaternion(tRot);
          camera.position.copy(tPos).add(offset);
          camera.lookAt(tPos);
        }
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
      };
      frameId = requestAnimationFrame(animate);
    };
    run();
    return () => {
      isUnmounted = true;
      if (frameId) cancelAnimationFrame(frameId);
      if (recorder && recorder.state === "recording") recorder.stop();
      if (renderer) renderer.dispose();
    };
  }, [data]);
  return /* @__PURE__ */ jsxDEV("div", { style: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "black",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column"
  }, children: [
    /* @__PURE__ */ jsxDEV("h2", { style: { color: "white", fontFamily: "sans-serif" }, children: [
      "RENDERING REPLAY: ",
      Math.round(progress * 100),
      "%"
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 303,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV(
      "canvas",
      {
        ref: canvasRef,
        width: 1280,
        height: 720,
        style: {
          width: "640px",
          height: "360px",
          border: "1px solid #333",
          marginTop: "20px"
        }
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 304,
        columnNumber: 13
      }
    )
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 299,
    columnNumber: 9
  });
};
const RemotionOverlay = () => {
  const [replayData, setReplayData] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    const handleReplay = (e) => {
      console.log("Overlay received render-replay", e.detail);
      setReplayData(e.detail);
      setRecordedUrl(null);
      setError(null);
    };
    const handleClose = () => {
      setReplayData(null);
      setRecordedUrl(null);
      setError(null);
    };
    window.addEventListener("render-replay", handleReplay);
    window.addEventListener("close-replay", handleClose);
    return () => {
      window.removeEventListener("render-replay", handleReplay);
      window.removeEventListener("close-replay", handleClose);
    };
  }, []);
  const handleComplete = (url) => {
    setRecordedUrl(url);
    window.dispatchEvent(new CustomEvent("render-complete", { detail: { success: true, url } }));
  };
  const handleError = (msg) => {
    setError(msg);
    window.dispatchEvent(new CustomEvent("render-complete", { detail: { success: false, error: msg } }));
  };
  const downloadVideo = () => {
    if (recordedUrl) {
      const a = document.createElement("a");
      a.href = recordedUrl;
      a.download = `skydrop-replay-${(/* @__PURE__ */ new Date()).toISOString().replace(/:/g, "-")}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };
  if (!replayData) return null;
  return /* @__PURE__ */ jsxDEV("div", { style: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 99999,
    pointerEvents: "auto",
    background: "#000000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }, children: [
    !recordedUrl && !error && /* @__PURE__ */ jsxDEV(
      ThreeJsRecorder,
      {
        data: replayData,
        onComplete: handleComplete,
        onError: handleError
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 375,
        columnNumber: 17
      }
    ),
    (recordedUrl || error) && /* @__PURE__ */ jsxDEV("div", { style: {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column"
    }, children: /* @__PURE__ */ jsxDEV("div", { style: {
      background: "#222",
      padding: "40px",
      borderRadius: "20px",
      textAlign: "center",
      border: "2px solid #555",
      maxWidth: "500px"
    }, children: [
      error ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
        /* @__PURE__ */ jsxDEV("h2", { style: { color: "#ff4444", marginBottom: "20px" }, children: "RENDER FAILED" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 394,
          columnNumber: 33
        }),
        /* @__PURE__ */ jsxDEV(
          "p",
          {
            style: { color: "#aaa", marginBottom: "30px", cursor: "pointer", border: "1px solid #444", padding: "10px", borderRadius: "5px" },
            onClick: () => {
              if (navigator.clipboard) navigator.clipboard.writeText(error);
            },
            title: "Click to copy error",
            children: [
              error,
              /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 403,
                columnNumber: 37
              }),
              /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.8rem", color: "#666" }, children: "(Click to copy)" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 403,
                columnNumber: 42
              })
            ]
          },
          void 0,
          true,
          {
            fileName: "<stdin>",
            lineNumber: 395,
            columnNumber: 33
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 393,
        columnNumber: 29
      }) : /* @__PURE__ */ jsxDEV(Fragment, { children: [
        /* @__PURE__ */ jsxDEV("h2", { style: { color: "white", marginBottom: "30px" }, children: "REPLAY READY" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 408,
          columnNumber: 33
        }),
        /* @__PURE__ */ jsxDEV(
          "video",
          {
            src: recordedUrl,
            controls: true,
            autoPlay: true,
            loop: true,
            style: { width: "100%", marginBottom: "20px", borderRadius: "8px", border: "1px solid #444" }
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 409,
            columnNumber: 33
          }
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: downloadVideo,
            style: {
              padding: "15px 30px",
              fontSize: "20px",
              fontWeight: "bold",
              color: "white",
              background: "#00cc00",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              marginBottom: "15px",
              width: "100%"
            },
            children: "SAVE TO DEVICE"
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 416,
            columnNumber: 33
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 407,
        columnNumber: 29
      }),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => window.dispatchEvent(new CustomEvent("close-replay")),
          style: {
            padding: "15px 30px",
            fontSize: "16px",
            color: "#aaa",
            background: "transparent",
            border: "2px solid #555",
            borderRadius: "10px",
            cursor: "pointer",
            width: "100%"
          },
          children: "CLOSE"
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 428,
          columnNumber: 25
        }
      )
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 388,
      columnNumber: 21
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 383,
      columnNumber: 18
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 369,
    columnNumber: 9
  });
};
const root = document.getElementById("remotion-root");
if (root) {
  createRoot(root).render(/* @__PURE__ */ jsxDEV(RemotionOverlay, {}, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 447,
    columnNumber: 29
  }));
}
