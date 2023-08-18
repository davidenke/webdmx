export async function implicitlyRequestPermissions(): Promise<USBDevice | false> {
  try {
    return navigator.usb.requestDevice({ filters: [] });
  } catch (error) {
    return false;
  }
}
