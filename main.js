const tmi = require('tmi.js');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const notifier = require('node-notifier');

require('dotenv').config();

console.log('username: ' + process.env.TWITCH_USERNAME);
console.log('channels: ' + JSON.stringify(JSON.parse(process.env.TWITCH_CHANNELS), ' ', 0));
// console.log(process.env.TWITCH_OAUTH_TOKEN);


let loggedIn = false;
let browser;
let page;
let date = new Date();

var prevCoins = 0;
var isLive = false
initialRun = true;

// Twitch client
let client;

function joinTwitch() {
    client = new tmi.Client({
        options: { debug: false  },
        connection: {
            reconnect: true,
            secure: true
        },
        identity: {
            username: process.env.TWITCH_USERNAME,
            password: process.env.TWITCH_OAUTH_TOKEN
        },
        channels: JSON.parse(process.env.TWITCH_CHANNELS)
    });
    
    client.connect().catch(console.error);
    
    client.on('message', (channel, tags, message, self) => {
        if(self) return;
        // if(message.toLowerCase() === '!hello') {
        //     client.say(channel, `@${tags.username}, heya!`);
        // }
    });
}

async function runBrowser() {
    
    await launchBrowser(true);

    await page.goto('https://play.inygon.pt/', {'waitUntil': 'networkidle0'});

    await checkInygonLogin(page);

    if (!loggedIn) {
        console.log("Not logged in!");
        await launchBrowser(false);
        await loginToInygon(page);
    }
    else {
        await getDragonCoins();
        await startPeriodicLoop();    
    }

}


async function launchBrowser(headless) {
   
    if (browser !== undefined) {
        await browser.close();
    }

    browser = await puppeteer.launch({
        args : [
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ],
        headless: headless,
    });

    page = await browser.newPage();

    page.on("pageerror", async (err) => {  
        theTempValue = err.toString();
        console.log(theTempValue); 
    });

    page.on("error", async (err) => {  
        theTempValue = err.toString();
        console.log(theTempValue); 
    });

    page.on('console', async (msg) => {
            console.log(msg.text());
    });
    
    await importCookies(page);
}

async function checkInygonLogin() {
    loggedIn = (await page.$('#top-cart > h6 > a') === null);
}

async function loginToInygon(){

    await page.goto('https://play.inygon.pt/', {'waitUntil': 'networkidle0'});
    // Click "Login Pela Twitch" button
    await (await page.$('#top-cart > h6 > a')).click();

    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    await page.type('#login-username', process.env.TWITCH_USERNAME, {delay: 100});
    await sleep(300);
    await page.type('#password-input', process.env.TWITCH_PASSWORD, {delay: 100});
    await (await page.$("#root > div > div.scrollable-area > div.simplebar-scroll-content > div > div > div > div.tw-mg-b-1 > form > div > div:nth-child(3) > button")).click();

    page.on('load', checkForInygonPage);
}

async function checkForInygonPage() {

    let url = page.url();

    if (url.includes("play.inygon.pt")) {
        console.log("Logged in!");
        
        await saveCookies(page);

        await page.removeListener('load', checkForInygonPage);

        await launchBrowser(true);

        await getDragonCoins();
        await startPeriodicLoop();    
    }
}

async function startPeriodicLoop() {
    setInterval(getDragonCoins,  10 * 60 * 1000); //prints current amount of prevCoins every 10m
}

async function getDragonCoins() { // Prints and returns the amount of DragonCoins
    await page.goto('https://play.inygon.pt/', {'waitUntil': 'networkidle0'});

    let coinsElementSelector = '#top-account > ul > a:nth-child(1)';

    await page.waitForSelector(coinsElementSelector)
    let element = await page.$(coinsElementSelector);
    let value = await page.evaluate(element => element.textContent, element);
    let coins = value.replace('Perfil Dragon Coins: ', '');

    if(initialRun){
    	prevCoins = coins;
    	initialRun = false;
    }

   if(!isLive && (coins > prevCoins)){ 

        notifier.notify({
            title: 'Inygon Twitch Bot',
            message: 'Some Inygon channel is LIVE!',
            icon: path.join(__dirname, 'notification_icon.jpg'),
            sound: false
        });

        console.log("Inygon is LIVE!");
        isLive = true;
    }

    let hour = date.getHours(); 
    let minute = date.getMinutes();
    console.log('[%d:%d] Dragon Coins: ' + coins, hour, minute);

}

async function saveCookies() {
    try {
        const cookies = await page.cookies('https://play.inygon.pt/', 'https://twitch.tv');
        fs.writeFileSync(path.join(__dirname, './cookies.json'), JSON.stringify(cookies, null, 2));
        loggedIn = true;
    
    }
    catch (exception) {
        
    }
}

async function importCookies() {

    let result;
    try {
        const cookiesString = fs.readFileSync(path.join(__dirname, './cookies.json'));
        const cookies = JSON.parse(cookiesString);
        await page.setCookie(...cookies);    
        result = true;
    }
    catch (exception) {
        result = false;
        console.log("Failed to import cookies");
    }

    return result;
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function main() {
    joinTwitch();
    runBrowser();
}

main();