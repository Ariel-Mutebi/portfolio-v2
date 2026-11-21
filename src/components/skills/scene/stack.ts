import { Box3, Group, Vector3 } from 'three';
import type { Object3D } from 'three';

export interface PlateStack {
  plates: Group[];
  restY: number[];   // where each plate ends up when fully stacked
  dropHeight: number;
}

// A 4x4 LEGO plate is 8 units of body plus 4 units of stud (12 total).
// Plates interlock, so each one sits 8/12 of the full height above the last.
const STACK_PITCH_RATIO = 8 / 12;

export function createStack(
  model: Object3D,
  count: number,
  dropHeight: number
): PlateStack {
  const fullHeight = new Box3()
    .setFromObject(model)
    .getSize(new Vector3()).y;

  const pitch = fullHeight * STACK_PITCH_RATIO;

  const plates: Group[] = [];
  const restY: number[] = [];

  for (let i = 0; i < count; i++) {
    const plate = new Group();

    plate.add(i === 0 ? model : model.clone());

    restY.push(i * pitch);
    plate.position.y = restY[i];

    plates.push(plate);
  }

  return { plates, restY, dropHeight };
}

// Pure function of progress: same input, same result, in any order.
export function applyProgress(stack: PlateStack, progress: number): void {
  const { plates, restY, dropHeight } = stack;

  const falling = plates.length - 1; // plate 0 is the base and never moves

  for (let i = 1; i < plates.length; i++) {
    // 0 before this plate's slice of progress, 1 after it, linear in between
    const t = Math.min(Math.max(progress * falling - (i - 1), 0), 1);

    plates[i].visible = t > 0;
    plates[i].position.y = restY[i] + (1 - t) * dropHeight;
  }
}
