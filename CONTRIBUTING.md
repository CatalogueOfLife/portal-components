## Prerequisites
[Node.js](http://nodejs.org/) 16.x must be installed.
It is recommended to use [NVM](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating) 
This allows to easily switch between node versions.

If you have nvm installed, you can simply run `nvm use`.

## Installation

- Running `npm install` in the component's root directory will install everything you need for development.

## Demo Development Server

- `npm start` will run a development server with the component's demo app at [http://localhost:3000](http://localhost:3000) with hot module reloading.

## Running Tests

- `npm test` will run the tests once.

- `npm run test:coverage` will run the tests and produce a coverage report in `coverage/`.

- `npm run test:watch` will run the tests on every change.

## Building

- `npm run build` will build the component for publishing to npm and also bundle the demo app.

- `npm run clean` will delete built resources.


## Releasing a version

- When you have changed code, do a build locally: `npm run build`
- Remember to update version in [package.json](https://github.com/CatalogueOfLife/portal-components/blob/d2b869bc11382910da4b218fe6f1c1ae6fd50f15/package.json#L3)
- Add everything in git: `git add -A`, commit and push
- [Do a release in GitHub](https://github.com/CatalogueOfLife/portal-components/releases)
- Go to [https://www.jsdelivr.com/tools/purge](https://www.jsdelivr.com/tools/purge), and purge the cache of these urls:
- https://cdn.jsdelivr.net/gh/CatalogueOfLife/portal-components@latest/umd/col-browser.min.js
- https://cdn.jsdelivr.net/gh/CatalogueOfLife/portal-components@latest/umd/col-browser.min.css
