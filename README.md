# Discover

## Web interface for exploring deep audio embeddings

This project is a web audio application that performs concatenative synthesis for the Wandering Mind. At start, Discover loads in a json data file of 2d points corresponding to short audio clips. The short clips are accessed in the associated files by seeking to the index point indicated in the json, and mixed with a roll-off curve according to the listener position and an audible range parameter.

The project was conceived by slow immediate LLC for our project the Wandering Mind. Original software development was led by [Nan Zhao](https://github.com/nandev/), with input by Gershon Dublon. The project was forked and eventually spun off in March 2021 with substantial changes. As of summer 2021, the platform is in active use for artistic performances as well as for research purposes with the team at [DVIC](https://dvic.devinci.fr/).

## Running the application 

#### Before you start

A database of audio files must be supplied to the application in order to run it. The easiest way to do this without moving large numbers of files around is using a symbolic link called "sample" in the "/public" directory to a mounted drive or directory.

Various node versions are likely to work, but we can guarantee node 12. 
 
Run `yarn install`.

#### To run the application

Run `yarn start`. A browser window should open, pointing to `localhost:3000`.

![screenshot of the web interface of the Discover application](https://github.com/gershhub/discover/blob/main/public/screenshot_interface.png?raw=true)

## More info / autogenerated things

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `npm run build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify
