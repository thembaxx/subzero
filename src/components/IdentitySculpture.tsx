"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import * as THREE from "three";
import { TraceMark } from "./Logo";

export default function IdentitySculpture() {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
    camera.position.set(0, 0, 7.7);
    scene.add(new THREE.AmbientLight(0xffffff, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 4);
    key.position.set(-3, 5, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xe5ffc7, 3);
    rim.position.set(4, -1, 2);
    scene.add(rim);
    const sculpture = new THREE.Group();
    scene.add(sculpture);
    const material = new THREE.MeshStandardMaterial({
      color: resolvedTheme === "dark" ? 0xbedc88 : 0x9eb675,
      roughness: 0.42,
      metalness: 0.15,
    });
    const geometries: THREE.BufferGeometry[] = [];
    for (let ring = 0; ring < 35; ring++) {
      const radius = 0.12 + ring * 0.039;
      const points: THREE.Vector3[] = [];
      for (let step = 0; step <= 160; step++) {
        const angle = (step / 160) * Math.PI * 2;
        const ripple = 1 + Math.sin(angle * 3 + radius * 1.8) * 0.045;
        const x = Math.sin(angle) * radius * 0.89 * ripple;
        const y = Math.cos(angle) * radius * 1.18 * ripple;
        const z =
          Math.sqrt(Math.max(0, 2.7 - radius * radius)) * 0.57 +
          Math.sin(angle * 2 + radius) * 0.12;
        points.push(new THREE.Vector3(x, y, z));
      }
      const curve = new THREE.CatmullRomCurve3(points, true);
      const geometry = new THREE.TubeGeometry(curve, 160, 0.018 + ring * 0.00017, 7, true);
      geometries.push(geometry);
      sculpture.add(new THREE.Mesh(geometry, material));
    }
    sculpture.rotation.set(0.06, -0.55, -0.3);
    sculpture.position.y = 0.05;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let pointerX = 0,
      pointerY = 0,
      frame = 0,
      visible = true;
    function resize() {
      if (!element) return;
      const width = element.clientWidth,
        height = element.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    }
    function animate(time: number) {
      frame = 0;
      if (!visible || document.hidden) return;
      if (!reduced.matches) {
        sculpture.rotation.y +=
          (-0.55 + pointerX * 0.3 + Math.sin(time * 0.00022) * 0.12 - sculpture.rotation.y) * 0.035;
        sculpture.rotation.x += (0.06 + pointerY * 0.18 - sculpture.rotation.x) * 0.035;
        sculpture.position.y = 0.05 + Math.sin(time * 0.00065) * 0.06;
      }
      renderer.render(scene, camera);
      if (!reduced.matches) frame = requestAnimationFrame(animate);
    }
    function start() {
      if (!frame && visible && !document.hidden) frame = requestAnimationFrame(animate);
    }
    function onPointer(event: PointerEvent) {
      if (!element) return;
      const bounds = element.getBoundingClientRect();
      pointerX = (event.clientX - bounds.left) / bounds.width - 0.5;
      pointerY = (event.clientY - bounds.top) / bounds.height - 0.5;
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(element);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else cancelAnimationFrame(frame);
      frame = visible ? frame : 0;
    });
    intersection.observe(element);
    element.addEventListener("pointermove", onPointer);
    document.addEventListener("visibilitychange", start);
    reduced.addEventListener("change", start);
    resize();
    start();
    setReady(true);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      element.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", start);
      reduced.removeEventListener("change", start);
      geometries.forEach((geometry) => geometry.dispose());
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [resolvedTheme]);
  return (
    <div
      className={`identity-sculpture${ready ? " sculpture-ready" : ""}`}
      ref={host}
      aria-hidden="true"
    >
      <div className="sculpture-fallback">
        <TraceMark />
      </div>
    </div>
  );
}
