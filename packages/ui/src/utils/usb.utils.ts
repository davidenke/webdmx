export async function implicitlyRequestPermissions(): Promise<USBDevice | undefined> {
  try {
    return navigator.usb.requestDevice({ filters: [] });
  } catch (error) {
    return undefined;
  }
}
