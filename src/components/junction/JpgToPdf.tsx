"use client";
import React from "react";
import ImageToPdfTool from "./ImageToPdfTool";
export default function JpgToPdf() {
  return <ImageToPdfTool title="JPG to PDF" description="Create a customized PDF from JPG images" accept=".jpg,.jpeg,image/jpeg" extensions={[".jpg", ".jpeg"]} accent="#467AF2" />;
}
