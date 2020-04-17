import { DeviceType } from 'devices/models';

export function formatSuccessResponse(type: DeviceType, action: 'paired' | 'discover'): string {
  const res = {
    [DeviceType.hub_10]: 'hub',
    [DeviceType.sensor_10]: 'sensor',
  }[type];
  return `success: ${res} ${action}`;
}
