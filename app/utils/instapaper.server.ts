export async function addToInstapaper(
  username: string,
  password: string,
  url: string,
  title: string
) {
  let body: string = `url=${encodeURIComponent(url)}&title=${encodeURIComponent(
    title
  )}`;

  const credentials = `${username}:${password}`;
  console.log(btoa(credentials));
  const res = await fetch(`https://www.instapaper.com/api/add`, {
    body: body,
    method: "post",

    headers: {
      Authorization: `Basic ${btoa(credentials)}`,
    },
  });
  console.log(res.status);
}
