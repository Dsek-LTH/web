# poppler-server

Poppler is a PDF rendering library. This project wraps the `pdftotext` utility provided by Poppler's `poppler-utils` package in a simple HTTP server.

## Development

A docker container is provided for development.

Start the development container:

```sh
docker compose up poppler-server
```

Test the PDF to text endpoint:

```sh
curl -X POST -F "file=@example.pdf" http://localhost:8800/
```
