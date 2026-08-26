"use client";
import React from "react";
import ImageToPdfTool from "./ImageToPdfTool";
export default function PngToPdf() {
  return <ImageToPdfTool title="PNG to PDF" description="Create a customized PDF from PNG images" accept=".png,image/png" extensions={[".png"]} accent="#A885E2" />;
}
