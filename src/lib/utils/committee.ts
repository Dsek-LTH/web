import DOMPurify from "isomorphic-dompurify";

export const breakName = (name: string) => {
  let output = "";
  if (name.includes("utskottet"))
    output = `${name.split("utskottet")[0]}&shy;utskottet`;
  else if (name.includes("kommittén"))
    output = `${name.split("kommittén")[0]}&shy;kommittén`;
  else if (name.includes("mästeriet"))
    output = `${name.split("mästeriet")[0]}&shy;mästeriet`;
  else if (name.includes("rådet"))
    output = `${name.split("rådet")[0]}&shy;rådet`;
  else output = name;
  return DOMPurify.sanitize(output);
};
