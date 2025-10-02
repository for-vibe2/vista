<br />
<p align="center">
  <a href="https://github.com/zernonia/vista">
    <img src="public/logo.svg" alt="Vista's Logo" width="80">
  </a>
  <br />

  <p align="center">
    Automatic, Animated subtitle generation for<br> short-form video! 
  </p>

  <p align="center"> 
    <a href="https://www.vistaeditor.com/">View Demo</a>
    ·
    <a href="https://github.com/zernonia/vista/issues">Report Bug</a>
    ·
    <a href="https://github.com/zernonia/vista/issues">Request Feature</a>
  </p>
</p>

<br/>

![vista - automatic, animated subtitle generation for short-form video](public/og.png)

## Story

Vista started life as a hackathon submission and was inspired by those animated subtitles while scrolling through Youtube Shorts. I always wanted to play with [ffmpeg](https://ffmpeg.org/), and this serves as a good opportunity!

This ends up a super challenging task:

1. I need to run ffmpeg for video encoding, but hosting a server will required a lot of coding & maintenance, thus resorting to use ffmpeg-wasm, which could be use on modern browser that supports wasm.

2. Perform speech-to-text is not an easy task, to speed up MVP, I've utilized AssemblyAI API for the video transcription.

3. Because speech-to-text is an async task, I originally paired it with a webhook to let the UI know when a transcription is ready.

Today the app relies solely on the bundled SQLite database for persistence, so you can run it entirely locally without any Supabase services.

## 🚀 Features

- 🤩 Free
- 📖 Open-Source

### 🔨 Built With

- [Nuxt 3](https://v3.nuxtjs.org/)
- [UnoCss](https://uno.antfu.me/)
- [AssemblyAI](https://www.assemblyai.com/)
- [FFmpeg.wasm](https://ffmpegwasm.netlify.app/)

## 🌎 Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer (Corepack is bundled and keeps Yarn in sync with the repo)
- [Yarn](https://yarnpkg.com/) (installed automatically by Corepack when you run the commands below)

### Environment variables

Copy the example file and adjust any values you need:

```sh
cp .env.example .env
```

All variables are optional. The app falls back to sensible defaults when they are not set.

| Variable | Description |
| --- | --- |
| `DATABASE_PATH` | Override the default location of the SQLite database (`./data/database.sqlite`). |
| `UMAMI_WEBSITE_ID` | Expose your Umami website ID so production builds can report analytics. |

### Development

1. Clone the repo
   ```sh
   git clone https://github.com/zernonia/vista.git
   ```
2. Install dependencies
   ```sh
   cd vista
   corepack enable
   yarn install
   ```
3. Run database migrations (creates `./data/database.sqlite` on the first run)
   ```sh
   yarn migrate
   ```
4. Start the local development server
   ```sh
   yarn dev
   ```

### Docker

Build a production image that runs SQLite migrations automatically:

```sh
docker build -t vista-sqlite .
```

Provide your `.env` file (if you need to override defaults) when running the container:

```sh
docker run --rm -p 3000:3000 --env-file .env vista-sqlite
```

## ➕ Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Acknowledgement

1. [Nuxt 3 - Awesome framework](https://v3.nuxtjs.org/)

## Author

- Zernonia ([@zernonia](https://twitter.com/zernonia))

Also, if you like my work, please buy me a coffee ☕😳

<a href="https://www.buymeacoffee.com/zernonia" target="_blank">
    <img src="https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png" alt="Logo" >
  </a>

## 🔥 Contributors

<a href="https://github.com/zernonia/vista/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=zernonia/vista" />
</a>

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
