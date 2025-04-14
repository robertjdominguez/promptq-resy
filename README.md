# PromptQ-Resy

## Overview

PromptQ-Resy is a project that allows you to make restaurant reservations using the Resy API. It uses the PromptQL
service to provide a conversational interface for making reservations. The project is built using Hasura and the Resy
API. It is designed to be easy to use and provides a simple way to make reservations at your favorite restaurants or
when exploring a new city.

## Setup

### Step 1. Get your credentials from Resy

### `payment_id`

You'll need to find your payment ID. This is a little tricky, but not too bad. In the Network tab, find the request
that's made after you authenticate to Resy. You can search for `user` in the requests and find the one that has your
user information. `payment_method` is in there as an object and has a field of `id`. That's what you want.

### Auth Token

This is easier to find. You can head to Application > Cookies > https://resy.com and find the `authToken` cookie.

### Step 2. Get your credentials from our auth service

```sh
curl -X POST https://auth-service.hasura.workers.dev/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "<your email>",
    "password": "<make up something memorable yet unimportant...we didnt have time for reset logic>",
    "auth_token": "<your auth token from step 1>",
    "payment_id": "<your payment id from step 1>"
  }'
```

This will return a JWT which you can use to authenticate to the PromptQL service. **Your JWT is good for one day.** If
you need to regenerate one, use the `signin` endpoint instead of `signup` and use the same email and password you used
in the previous step.

```sh
 curl -X POST https://auth-service.hasura.workers.dev/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "SomethingMemorableYetUnimportant"
  }'
```

### Step 3. Request access to the project

Visit this link to request access to the project:
[https://promptql.console.hasura.io/project/promptq-resy/](https://promptql.console.hasura.io/project/promptq-resy/)

### Step 4. Book some meals!

Once you have access to the project, you can start making reservations. From the PromptQL Playground, click the `Auth`
button in the input and add your JWT as a header value. This will ensure the application knows who you are and can make
reservations on your behalf.

Then, start talking to it!

```plaintext
> Can you find my dog and I a restaurant in San Francisco for tomorrow night?
```

## Caveats

- This uses the **Resy** API...that means results are limited to restaurants that are on Resy. If you want to use this
  for a restaurant that isn't on Resy, you're out of luck.
- Each request will never return more than twenty results. While this is sort of a limitation of the Resy API, it's a
  feature, not a bug: the more choice you have the harder it is to decide.
- This is real...you book it, you buy it. If you cancel, you may be charged a fee depending on the restaurant and time
  until your reservation. So be careful!
