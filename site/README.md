# Truefit React Template

This template is meant to be the starting baseline for the front end of Truefit web projects. It includes the basic starting point for a lot of the common libraries as well as the configuration of webpack, debugging, etc.

## Getting Started

- Clone this repo to your local machine
- Copy all files (except .git) over to your project directory.
- Change the name in the package.json
- Run `yarn install`
- Remove the `app/features/example` folder
- Run `yarn todo` and evaluate which you need to address
  - If you are not running in the .Net context, pay special attention to the note in configureHttp

## Component Layout

Given what react is, components end up being the largest part of the codebase. To keep these readable and consistent across the team(s), please use the following layout pattern (see app/features/example/components/Paper.tsx):

- imports
- component prop types
- component layout
- effect and callback handlers
- compose

## Resources

- [Redux toolkit](https://redux-toolkit.js.org/usage/usage-guide)
- [Bach](https://bach.truefit.io)
- [Material UI](https://material-ui.com/)
- [React Router](https://reacttraining.com/react-router/)

## Wall-E

Wall-E is an internal Truefit cli tool that attempts to make your life easier. Currently it focuses on generating your index files for actions, components, reducers, selectors, util, constants, types, and the root reducer. In doing so, it will also generate the type definitions for the reducer state tree.

It is installed as a dev dependency and we have added a number of npm scripts to make using it simple. It is tied into `yarn start`.

If you don't want to use it, remove the scripts that start with "generate" and update the "start" and "build" commands.

## System Requirements

- Ensure the current Node LTS version is installed (recommend using NVM to manage Node versions). If NVM is install, a `nvm install` will install the correct version if it is not already.
