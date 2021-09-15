## Notes

- routes served up under /api

### Serving up app in a monorepo

```
const path = require('path');
const history = require('connect-history-api-fallback');

...

app.use(history({
  rewrites: [
    {
      from: /\/api/,
      to: function(context) {
        return context.parsedUrl.pathname;
      }
    },
  ],
}));
app.use('/', express.static(path.join(__dirname, '../app/dist')));
```

### Enabling HTTPS

- For local development, generate certs with [mkcert](https://github.com/FiloSottile/mkcert)

```
const https = require('https');
const fs = require('fs');

...

const httpsServer = https.createServer({
  key: fs.readFileSync(__dirname + '/sslcert/192.168.0.133-key.pem', 'utf8'),
  cert: fs.readFileSync(__dirname + '/sslcert/192.168.0.133.pem', 'utf8'),
}, app);
httpsServer.listen(8000);
```