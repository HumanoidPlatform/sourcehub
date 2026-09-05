// Mounts the upload loop for the life of the app. Rendered once in the root
// layout; renders nothing.

import { useEffect } from "react";
import { uploader } from "./uploader";

export function UploaderMount() {
  useEffect(() => {
    uploader.start();
    return () => uploader.stop();
  }, []);
  return null;
}
