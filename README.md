# ShopRenter demo app in NodeJS

https://github.com/Shoprenter/sr-demo-app-node

# Requirements

* NodeJS minimum v8 (not tested with v10)
* yarn or npm

# Install

```
git clone https://github.com/Shoprenter/sr-demo-app-node
npm install
cp .env-default .env
```

# Configuration

Fill these 5 config variables in .env with your app info. If you don't know, contact SR app support.

```
SR_APP_ENTRYPOINT=/
SR_APP_REDIRECTURI=/auth/shoprenter
SR_APP_APPID=[AppId]
SR_APP_CLIENTID=[ClientId]
SR_APP_CLIENTSECRET=[ClientSecret]
```

# Running

```
npm run start
```

