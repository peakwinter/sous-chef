export default {
  dateFormatter(date) {
    if (!date) return '';
    let day = date.getDate();
    let month = date.getMonth() + 1;
    const year = date.getFullYear();
    if (month < 10) month = `0${month}`;
    if (day < 10) day = `0${day}`;
    return `${year}-${month}-${day}`;
  },

  monthFormatter(date) {
    if (!date) return '';
    let month = date.getMonth() + 1;
    const year = date.getFullYear();
    if (month < 10) month = `0${month}`;
    return `${year}-${month}`;
  },
};
