import axios from "axios";

export function finalConfig(authToken: string) {
  const configObject = {
    method: "post",
    maxBodyLength: Infinity,
    url: `https://api.resy.com/3/book`,
    headers: {
      authority: "api.resy.com",
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9,la;q=0.8",
      authorization: 'ResyAPI api_key="VbWk7s3L4KiK5fzlO7JD3Q5EYolJI7n5"',
      "cache-control": "no-cache",
      "content-type": "application/x-www-form-urlencoded",
      origin: "https://widgets.resy.com",
      referer: "https://widgets.resy.com/",
      "sec-ch-ua": '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
      "x-origin": "https://widgets.resy.com",
      "x-resy-auth-token": `${authToken}`,
      "x-resy-universal-auth": `${authToken}`,
    },
  };
  return configObject;
}

export function bookingConfig(token: string, date: string, party_size: string) {
  // parse token as url encoded string
  const slotId = encodeURIComponent(token);
  const configObject = {
    method: "get",
    maxBodyLength: Infinity,
    url: `https://api.resy.com/3/details?&day=${date}&party_size=${party_size}&config_id=${slotId}`,
    headers: {
      authority: "api.resy.com",
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9,la;q=0.8",
      authorization: 'ResyAPI api_key="VbWk7s3L4KiK5fzlO7JD3Q5EYolJI7n5"',
      "cache-control": "no-cache",
      origin: "https://resy.com",
      referer: "https://resy.com/",
      "sec-ch-ua": '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
      "x-origin": "https://resy.com",
    },
  };
  return configObject;
}

export async function getBookToken(slot_id: string, date: string, party_size: string): Promise<string> {
  try {
    const response = await axios.request(bookingConfig(slot_id, date, party_size));
    return response.data.book_token.value;
  } catch (error) {
    console.log(error);
    return "";
  }
}
