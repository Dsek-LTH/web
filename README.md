<a name="readme-top"></a>

<!-- PROJECT SHIELDS -->

[![Version][version-shield]][version-shield]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Contributors][contributors-shield]][contributors-url]
[![Issues][issues-shield]][issues-url]
[![License][license-shield]][license-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/Dsek-LTH/web">
    <img src="https://www.dsek.se/favicon/D-favicon-196.png" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">Web</h3>

  <p align="center">
    The main web page for the D-guild
    <br />
    <a href="https://www.dsek.se/"><strong>dsek.se</strong></a>
    <br />
    <br />
    <a href="https://github.com/Dsek-LTH/web/issues/new/choose">Report Bug</a>
    ·
    <a href="https://github.com/Dsek-LTH/web/issues/new/choose">Request Feature</a>
  </p>
</div>

<!-- ABOUT -->

## About

This repo contains code for our main web page. You can read more about the project in the [wiki](https://github.com/Dsek-LTH/web/wiki).

![builtwith][builtwith]
[![typescript][typescript]][typescript-url]
[![svelte][svelte]][svelte-url]
[![prisma][prisma]][prisma-url]
[![zod][zod]][zod-url]
[![expo][expo]][expo-url]

![using][using]
[![node][node]][node-url]
[![pnpm][pnpm]][pnpm-url]
[![docker][docker]][docker-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

To get a local copy up and running follow these simple steps.

### Prerequisites

You need to install the following tools by following the instructions on their respective websites. If you're running Windows, it's highly recommended to [first install WSL](https://learn.microsoft.com/en-us/windows/wsl/install).

1. Install Node.js: [https://nodejs.org/en/download/](https://nodejs.org/en/download/)
2. Install pnpm: [https://pnpm.io/installation](https://pnpm.io/installation)
3. Install Docker: [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)

### Installation

1. Clone the repo and change into the directory
   ```sh
   git clone https://github.com/Dsek-LTH/web.git && cd web
   ```
2. Install dependencies
   ```sh
   pnpm install
   ```
3. Setup .env.local by copying .env and filling in the values (ask a team member for credentials).
   ```sh
   cp .env .env.local
   ```
4. Setup your local development database. You may need to run this command with sudo. Learn more [here](https://github.com/Dsek-LTH/web/tree/main/dev).
   ```sh
   sh ./dev/setup_db.sh
   ```
5. Start the development server. It should be available on [http://localhost:5173](http://localhost:5173).
   ```sh
   pnpm dev
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->

## Development

The wiki contains a lot of useful information for developers. You can find it [here](https://github.com/Dsek-LTH/web/wiki). Note especially that VS Code is used and there are a few extensions **you should install** before starting development. These should be suggested by VS Code when you open the project for the first time, otherwise they can be found in `.vscode/extensions.json`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->

## Contributing

Any contributions you make are **greatly appreciated**. If you have a suggestion, please fork the repo and create a pull request. You can also simply open an issue using the links at the top.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->

## License

Distributed under the EUPL License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->

## Contact

Head of DWWW - dwww@dsek.se

Project Link: [https://github.com/Dsek-LTH/web](https://github.com/Dsek-LTH/web)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
<!-- https://shields.io/ -->

[contributors-shield]: https://img.shields.io/github/contributors/Dsek-LTH/web.svg?style=for-the-badge
[contributors-url]: https://github.com/Dsek-LTH/web/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/Dsek-LTH/web.svg?style=for-the-badge
[forks-url]: https://github.com/Dsek-LTH/web/network/members
[stars-shield]: https://img.shields.io/github/stars/Dsek-LTH/web.svg?style=for-the-badge
[stars-url]: https://github.com/Dsek-LTH/web/stargazers
[issues-shield]: https://img.shields.io/github/issues/Dsek-LTH/web.svg?style=for-the-badge
[issues-url]: https://github.com/Dsek-LTH/web/issues
[license-shield]: https://img.shields.io/github/license/Dsek-LTH/web.svg?style=for-the-badge
[license-url]: https://github.com/Dsek-LTH/web/blob/master/LICENSE
[version-shield]: https://img.shields.io/github/v/release/Dsek-LTH/web?style=for-the-badge
[product-screenshot]: images/screenshot.png

<!-- Badge icons: https://simpleicons.org/ -->

[builtwith]: https://img.shields.io/badge/built%20with-f280a1?style=for-the-badge
[using]: https://img.shields.io/badge/using-f280a1?style=for-the-badge
[typescript]: https://img.shields.io/badge/typescript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[typescript-url]: https://www.typescriptlang.org/
[svelte]: https://img.shields.io/badge/svelte-FF3E00?style=for-the-badge&logo=svelte&logoColor=white
[svelte-url]: https://svelte.dev/
[expo]: https://img.shields.io/badge/expo-000020?style=for-the-badge&logo=expo&logoColor=white
[expo-url]: https://expo.dev/
[prisma]: https://img.shields.io/badge/prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white
[prisma-url]: https://www.prisma.io/
[pnpm]: https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white
[pnpm-url]: https://pnpm.io/
[zod]: https://img.shields.io/badge/zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white
[zod-url]: https://zod.dev/
[docker]: https://img.shields.io/badge/docker-2496ED?style=for-the-badge&logo=docker&logoColor=white
[docker-url]: https://www.docker.com/
[node]: https://img.shields.io/badge/node-339933?style=for-the-badge&logo=node.js&logoColor=white
[node-url]: https://nodejs.org/
