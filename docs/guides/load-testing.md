# How to simulate heavy traffic

This guide will walk you through how to simulate a large number of users accessing the website at the same time. This is useful for testing how the website performs under load.

## Simple testing

1. Begin by installing `autocannon`, a tool for load testing HTTP servers. You can install it globally using `pnpm`:

   ```bash
   pnpm install -g autocannon
   ```

2. The development server is not suitable for realistic load testing, so you need to build and start the website first:

   ```bash
   pnpm build
   pnpm preview
   ```

3. To run a load test, you need to decide which page you want to test. For example, to test the website's news page, you can use `http://localhost:7777/news`.

   The following command starts the load test. It simulates 200 users accessing the news page as many times as possible for 20 seconds:

   ```bash
   autocannon -c 200 -d 20 --renderStatusCodes http://localhost:7777/news
   ```

4. Requests made by authenticated users often create more load on the server. If you need to test this, you can use the `--headers` option to send cookies or other headers. For example, to send a cookie with the request, you can use:

   ```bash
   autocannon -c 200 -d 20 --headers "Cookie":"authjs.session-token=..." http://localhost:7777/news
   autocannon -c 200 -d 20 --headers "Cookie":"externalCode=..." http://localhost:7777/news
   ```

   You may also want to send form data or other request information. For example, to send a POST request with form data, you can use:

   ```bash
    autocannon -c 200 -d 20 --method POST --idReplacement --renderStatusCodes --body "ticketId=f47cdd7b-e347-4d28-a0d1-e0babcc650f3" --headers "Cookie":"externalCode=[<id>]" --headers "Content-Type":"application/x-www-form-urlencoded" http://localhost:7777/shop/tickets?/addToCart
   ```

   Browsing the website normally and inspecting the requests using the browser's developer tools can help you identify the headers you need to send.

## Programmatic usage

If you need to run load tests programmatically, you can use the `autocannon` module in your Node.js scripts. Here is an example script that simulates 300 users adding a ticket to the cart:

```js
import autocannon from "autocannon";
import { randomBytes } from "crypto";

const base = "http://localhost:7777";
const path = "/shop/tickets?/addToCart";
const url = `${base}${path}`;
const ticket = "2f13d41b-67aa-4e06-84cf-e56633a5042a";
const ids = new Set();
const requests = 300;

const instance = autocannon(
  {
    url,
    connections: requests,
    amount: requests,
    timeout: 60,
    body: `ticketId=${ticket}`,
    method: "POST",
    setupClient: (client) => {
      const id = randomBytes(16).toString("hex");
      ids.add(id);
      client.setHeaders({
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: `externalCode=${id}`,
        origin: `${base}`,
        referer: `${base}/shop/tickets`,
        accept: "application/json, text/plain, */*",
      });
    },
  },
  finishedBench,
);

autocannon.track(instance, {});

function finishedBench(err, res) {
  console.log("finished bench", err, res);
  console.log("ids", ids.size);
}
```

Save this script to a file, for example `load-test.js`, and run it using `node`:

```bash
node load-test.js
```

## Considerations

- You may prefer to use other tools like `ab`, `wrk`, or `k6`. `autocannon` is chosen here because it is easy to use, but note that it may have [performance limitations](https://github.com/mcollina/autocannon#limitations).
- You can adjust the number of users and duration as needed. Note that [browsers may open multiple connections to the server](https://stackoverflow.com/a/985704), so the number of connections may not be the same as the number of users.
- Be careful when running load tests on production servers. They can cause high CPU usage and slow down the server for other users. Additionally, sending a large number of requests to the server can be considered a [DoS attack](https://en.wikipedia.org/wiki/Denial-of-service_attack) on the network.
