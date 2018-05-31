const config = {
    //set your oauth redirect url, defaults to localhost
    "wechatRedirectUrl": "http://fanstongs.com/auth?target=home",
    "appId": "wxf6a4e87064c3fbd2",
    "appSecret": "7fb75eea66988061a1ed9578e7d8fef4",
    card: true, //enable cards
    payment: true, //enable payment support
    merchantId: '', //
    paymentSandBox: true, //dev env
    paymentKey: '', //API key to gen payment sign
    paymentCertificatePfx: fs.readFileSync(path.join(process.cwd(), 'cert/apiclient_cert.p12')),
    paymentNotifyUrl: `http://your.domain.com/api/wechat/payment/`,
}

module.exports = config;