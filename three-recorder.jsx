import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { World } from "./world.js";
import { createRecorder } from "./capture-utils.js";
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
      const world = new World(scene);
      await world.loadAssets();
      if (isUnmounted) {
        renderer.dispose();
        return;
      }
      world.createLobby();
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
      const ghostMat = new THREE.MeshBasicMaterial({ color: 65280, wireframe: true });
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), ghostMat);
      const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.15), ghostMat);
      const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.15), ghostMat);
      scene.add(head, lHand, rHand);
      renderer.render(scene, camera);
      let audioStream = null;
      if (window.player && window.player.audio) {
        try {
          audioStream = window.player.audio.getStream();
        } catch (e) {
          console.warn("Could not get audio stream", e);
        }
      }
      recorder = createRecorder(
        canvasRef.current,
        fps,
        audioStream,
        (url) => {
          if (!isUnmounted) onComplete(url);
        },
        (err) => {
          if (!isUnmounted) onError(err);
        }
      );
      if (!recorder) return;
      let startTime = null;
      const totalDuration = data.duration + 500;
      const animate = (timestamp) => {
        if (isUnmounted) return;
        if (!startTime) {
          startTime = timestamp;
          if (recorder && recorder.state === "inactive") {
            recorder.start();
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
      lineNumber: 179,
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
        lineNumber: 180,
        columnNumber: 13
      }
    )
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 175,
    columnNumber: 9
  });
};
export {
  ThreeJsRecorder
};
