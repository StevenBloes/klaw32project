export function dateTimeFormatter(dateTimeStamp) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  return formatter.format(new Date(dateTimeStamp));
}

export function timeFormatter(timeStamp) {
  try {
    return timeStamp.slice(0, 5);
  } catch (err) {
    console.error(`Cannot format ${timeStamp} to date`);
    return "";
  }
}

export function timeToMinutes(timeStamp) {
  try {
    let sign = 1;
    if (timeStamp.startsWith("-")) {
      sign = -1;
      timeStamp = timeStamp.slice(1);
    }

    const [hours, minutes, seconds] = timeStamp.split(":").map(Number);
    return sign * (hours * 60 + minutes + (seconds ? seconds / 60 : 0));
  } catch (err) {
    console.error(`Cannot convert ${timeStamp} to minutes`);
    return "";
  }
}