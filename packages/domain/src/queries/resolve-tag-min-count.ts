import {getSetting} from './get-setting';

export async function resolveTagMinCount(): Promise<number> {
  const floorValue = await getSetting('tagCountFloor');
  const floor = floorValue ? Number(floorValue) : 1;
  return Number.isNaN(floor) ? 1 : floor;
}
