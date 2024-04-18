const getStartDateFromQuarterYear = (quarterString: string) => {
  const year = +quarterString.substr(0, 4);
  const querterNumber = parseInt(quarterString.substr(6, 6));
  return new Date(year, (querterNumber - 1) * 3, 1);
};

export default getStartDateFromQuarterYear;
