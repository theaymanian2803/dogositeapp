export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export function toDataUrl(base64: string): string {
  return `data:image/jpeg;base64,${base64}`;
}

export function isUnderLimit(base64: string): boolean {
  return base64.length <= MAX_IMAGE_BYTES;
}

export async function pickAndPrepareImage(): Promise<string | null> {
  const ImagePicker = await import("expo-image-picker");
  const ImageManipulator = await import("expo-image-manipulator");

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.8,
    base64: true,
  });
  if (result.canceled || !result.assets[0]?.base64) return null;

  let base64 = result.assets[0].base64;
  if (!isUnderLimit(base64)) {
    const context = ImageManipulator.ImageManipulator.manipulate(
      result.assets[0].uri,
    ).resize({ width: 1024 });
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({
      format: ImageManipulator.SaveFormat.JPEG,
      compress: 0.6,
      base64: true,
    });
    base64 = saved.base64 ?? base64;
  }
  return toDataUrl(base64);
}
