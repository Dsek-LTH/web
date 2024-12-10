# poppler-server

Build the image:

```sh
docker compose up -d
```

Test the PDF to text endpoint:

```sh
curl -X POST -F "file=@stadgar.pdf" http://localhost:8800/
```
