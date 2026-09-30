"use client";

import { createContext, useContext } from "react";

/**
 * Dashboard previews set this so a template opens straight on its post-signup
 * screen instead of its signup form.
 *
 * It lives in context rather than in props so the subscribe hook can read it
 * without every template having to forward a preview-only prop.
 */
export const PreviewDoneContext = createContext(false);

export function usePreviewDone(): boolean {
  return useContext(PreviewDoneContext);
}
