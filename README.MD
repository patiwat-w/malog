# MSU.MALog - Mobile First Form Application

This project is a form-based application built with React, designed with a mobile-first approach. It serves as a template for creating responsive forms that work seamlessly on mobile devices and scale up to desktops.

## Features

- **Mobile-First Design**: Styled with mobile screen sizes as the priority.
- **React Components**: Built with reusable and modular React components.
- **Standard Form Elements**: Includes common form inputs and validation.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Make sure you have Node.js and npm (or yarn) installed on your system.

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/get-npm) or [yarn](https://yarnpkg.com/getting-started/install)

### Installation

1. **Clone the repository**

    ```sh
    git clone <your-repository-url>
    cd MSU.MALog
    ```

2. **Install dependencies**
    Using npm:

    ```sh
    npm install
    ```

    Or using yarn:

    ```sh
    yarn install
    ```

### Available Scripts

In the project directory, you can run:

#### `npm start` or `yarn start`

Runs the app in development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in the browser. The page will reload if you make edits.

#### `npm test` or `yarn test`

Launches the test runner in interactive watch mode.

#### `npm run build` or `yarn build`

Builds the app for production to the `build` folder. It correctly bundles React in production mode and optimizes the build for the best performance.

## Built With

- [React](https://reactjs.org/) - The web framework used.
- [Create React App](https://github.com/facebook/create-react-app) - Project setup.

## Contributing

- Config in dotnet user-secrets list
- dotnet ef database update
$env:ConnectionStrings__SqlServer="Server=LAPTOP-RN2MUQRF;Database=MSUMALOG_DB;User Id=msu;Password=Patiwat9999;TrustServerCertificate=True;"