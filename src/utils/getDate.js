export default function getDate(date) {
  function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
  }
  return [date.getFullYear(), padTo2Digits(date.getMonth() + 1), padTo2Digits(date.getDate())].join('-');
}
