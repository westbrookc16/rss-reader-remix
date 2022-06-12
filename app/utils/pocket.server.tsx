import invariant from "tiny-invariant";

type pocket = {
  access_token: string;
  consumer_key: string;
  title: string;
  url: string;
};
export const addToPocket = async (
  accessToken: string,
  title: string,
  url: string
) => {
  invariant(process.env.POCKET_CONSUMER_KEY, "Consumer Key must be set.");
  const body: pocket = {
    access_token: accessToken,
    url,
    title,
    consumer_key: process.env.POCKET_CONSUMER_KEY,
  };
  const data = await fetch("https://getpocket.com/v3/add", {
    method: "post",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "X-Accept": "application/json",
    },
    body: JSON.stringify(body),
  });
  const returnedJson = await data.json();
  console.log(returnedJson);
};
