# DMX UI

A simple UI for controlling DMX lights in the browser via USB.

## Development

For using the Web USB API, a secure context is necessary. This means that the site must be served over HTTPS. For development, you can use the following command to create a self-signed certificate:

```bash
brew install mkcert
brew install nss
mkcert -install
mkcert -cert-file .ssl/local.cert -key-file .ssl/local.key localhost
```

Then, you can run the development server with:

```bash
npm run dev
```
