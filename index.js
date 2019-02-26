const express = require('express')
const app = express()
const port = 3000
const querystring = require('querystring')
const axios = require('axios')
const crypto = require('crypto')

require('dotenv').config()
const {
    SR_APP_ENTRYPOINT,
    SR_APP_REDIRECTURI,
    SR_APP_APPID,
    SR_APP_CLIENTSECRET,
    SR_APP_CLIENTID,
    SCRIPT_TAG_INIT
} = process.env

if (!SR_APP_ENTRYPOINT || !SR_APP_REDIRECTURI || !SR_APP_APPID || !SR_APP_CLIENTID || !SR_APP_CLIENTSECRET) {
    throw Error ('Please config your app in .env file')
}

async function insertScriptag(shopName, data) {
    if (!SCRIPT_TAG_INIT) {
        return
    }
    const shopDomain = shopName + '.shoprenter.hu'
    const scriptFileUrl = SCRIPT_TAG_INIT + '?shop=' + shopDomain
    const scriptTagApi = `https://${shopName}.api.shoprenter.hu/scriptTags`
    const sendData = {
        'data[src]': scriptFileUrl,
    }
    const config = {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        url: scriptTagApi,
        data: querystring.stringify(sendData),
        auth: {
            username: data.username,
            password: data.password,
        }
    }
    var response = await axios(config)
}

function validateHmac(query) {
    const { hmac, shopname, code, timestamp } = query
    const message = querystring.stringify({
        shopname: shopname,
        code: code,
        timestamp: timestamp
    })
    const generated_hash = crypto
    .createHmac('sha256', SR_APP_CLIENTSECRET)
    .update(message)
    .digest('hex')

    return generated_hash === hmac
}

async function getApiCredentials(query, shopDomain) {
    const { hmac, code, timestamp } = query
    
    const accessUrl = `https://${shopDomain}/admin/oauth/access_credential`
    const requestBody = querystring.stringify({
        client_id: SR_APP_CLIENTID,
        client_secret: SR_APP_CLIENTSECRET,
        code: code,
        timestamp: timestamp,
        hmac: hmac
    })

    return await axios({
        method: 'POST',
        url: accessUrl,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: requestBody,
    })
}

function saveCredentials(shopDomain, data) {
    // TODO - Save API user/pass to Database
}

/**
 *  EntryPoint to the APP
 *  /admin/app/[appId]
 */
app.get(SR_APP_ENTRYPOINT, (req, res) => {
    res.send('<html><body>Hello World!</body></html>')
})

/**
 *  RedirectUri for authenticating the APP
 *  /admin/app/install/[appId]
 */
app.get(SR_APP_REDIRECTURI, async (req, res) => {
    try {
        // Store domain can be *.shoprenter.hu or a custom domain too
        const shopDomain = req.headers.referer.split('/')[2]
        const { query } = req
        const { shopname } = query

        if (!validateHmac(query)) {
            return res.status(400).send('HMAC validation failed, please check your ClientSecret')
        }
        var response = await getApiCredentials(query, shopDomain)
        if (!response.data.username || !response.data.password) {
            res.status(400).send('Hiba történt, kérem keresse fel az app fejlesztőjét')
            console.log('ERROR: Oauth authentication failed, please check your ClientId')
            return
        }

        await saveCredentials(shopname, response.data)
        // Optional, if you want to use ScriptTag API
        await insertScriptag(shopname, response.data)

        res.redirect(`https://${shopDomain}/admin/app/${SR_APP_APPID}`)
    } catch (error) {
        console.log('ERROR', error)
        res.status(400).send('Hiba történt, kérem keresse fel az app fejlesztőjét')
    }
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))