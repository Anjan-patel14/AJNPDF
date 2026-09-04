import type { Metadata } from "next";
import PdfEditorLab from "@/components/junction/PdfEditorLab";

export const metadata: Metadata = {
  title: "AJN PDF Editor Lab V2",
  description: "Browser-only AJN PDF editor with detected-font visual matching.",
  robots: { index: false, follow: false },
};

export default function PdfEditorLabPage() {
  return <PdfEditorLab />;
}
