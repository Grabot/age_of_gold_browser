# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app run:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Building Podman

To create a production version of your app using podman:

```sh
podman build -t age_of_gold_browser .

podman run -d -p 3000:3000 age_of_gold_browser
```

Or simply run

```sh
podman-compose up -d
```

And check out the result on
http://127.0.0.1:3000/

## Building Podman on hub

First build the container

```sh
podman build -t age_of_gold_browser:1.0.0 .
```

Then tag it with your docker hub username

```sh
podman image tag age_of_gold_browser:1.0.0 <docker hub account>/age_of_gold_browser:1.0.0

podman push <docker hub account>/age_of_gold_browser:1.0.0
```

Than you can pull and run your container on the server

```sh
docker pull <docker hub account>/age_of_gold_browser:1.0.0

docker run -d -p 3000:3000 --env-file .env <docker hub account>/age_of_gold_browser:latest
```
