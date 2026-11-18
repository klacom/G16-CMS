"use client";
import { useEffect, useRef } from "react";
const dirtyForms = new Set<symbol>();
function unload(event: BeforeUnloadEvent) {
  if (dirtyForms.size) {
    event.preventDefault();
    event.returnValue = "";
  }
}
function navigate(event: MouseEvent) {
  if (
    !dirtyForms.size ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  const link =
    event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (
    !(link instanceof HTMLAnchorElement) ||
    link.target === "_blank" ||
    link.hasAttribute("download")
  )
    return;
  const target = new URL(link.href);
  if (
    target.origin === location.origin &&
    target.pathname === location.pathname &&
    target.search === location.search
  )
    return;
  if (!window.confirm("You have unsaved changes. Leave this page?")) {
    event.preventDefault();
    event.stopImmediatePropagation();
  } else dirtyForms.clear();
}
export function useUnsavedChanges(dirty: boolean) {
  const id = useRef(Symbol("form"));
  useEffect(() => {
    const key = id.current;
    if (dirty) {
      dirtyForms.add(key);
      if (dirtyForms.size === 1) {
        window.addEventListener("beforeunload", unload);
        document.addEventListener("click", navigate, true);
      }
    }
    return () => {
      dirtyForms.delete(key);
      if (!dirtyForms.size) {
        window.removeEventListener("beforeunload", unload);
        document.removeEventListener("click", navigate, true);
      }
    };
  }, [dirty]);
}
