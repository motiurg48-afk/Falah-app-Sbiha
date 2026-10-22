'use client';

let activeLayers = 0;
let suppressNextPop = false;

export function pushUiLayer() {
  activeLayers += 1;
}

export function popUiLayer() {
  activeLayers = Math.max(0, activeLayers - 1);
}

export function hasActiveUiLayer() {
  return activeLayers > 0;
}

export function setSuppressNextPop() {
  suppressNextPop = true;
}

export function consumeSuppressNextPop() {
  const v = suppressNextPop;
  suppressNextPop = false;
  return v;
}
