import * as ImageManipulator from "expo-image-manipulator";

/**
 * Resizes the captured InBody printout to exactly 1200px width.
 * This provides a consistent coordinate space for zonal OCR.
 */
export async function preprocessImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }], // Resize to 1200px width
    { format: ImageManipulator.SaveFormat.JPEG, compress: 0.9 },
  );

  return result.uri;
}

/**
 * Returns the width and height of an image at a given URI.
 */
export async function getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  // We use manipulateAsync with an empty actions array just to get the metadata
  const result = await ImageManipulator.manipulateAsync(uri, []);
  return {
    width: result.width,
    height: result.height,
  };
}
