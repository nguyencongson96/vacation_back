const arr1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 30, 25, 16, 35, 40, 82],
  arr2 = [1, 3, 5, 7, 9, 11, 13, 15, 12, 50, 30, 25, 40, 82];

export default function getDifference(arr1, arr2) {
  let index1 = 0;
  while (index1 < arr1.length) {
    const ele1 = arr1[index1];

    const index2 = arr2.indexOf(ele1);

    if (index2 >= 0) {
      arr1.splice(index1, 1);
      arr2.splice(index2, 1);
    } else index1++;
  }

  return { arr1: arr1, arr2: arr2 };
}
