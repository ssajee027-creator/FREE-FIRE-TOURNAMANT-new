export function placementPoints(p) {
  const map = {1:12, 2:9, 3:8, 4:7, 5:6, 6:5, 7:4, 8:3, 9:2, 10:2, 11:1, 12:1};
  return map[p] || 0;
}
export function totalPoints(placement, kills) {
  return placementPoints(Number(placement)) + Number(kills || 0);
}
