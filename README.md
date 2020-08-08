# inygon_twitch_bot
Twtich Bot that makes user online in selected livestreams.

## Set up instruction:

- Install node.js: https://nodejs.org/en/
- Open terminal in folder
- Run command: npm install
- Rename .env_example to .env

Fill .env file with the following:

    TWITCH_USERNAME: Your twitch username
    TWITCH_CHANNELS: List of twitch channels in JSON (defaults to all 3 inygon channels)
    TWITCH_OAUTH_TOKEN: Your twitch oauth token (https://twitchapps.com/tmi/)
    TWITCH_PASSWORD: Your twitch password
    NOTIFY: Whether you want OS notifications when inygon channels go online (true or false)

- run with the command: npm start

## Running instructions:

- Open terminal in folder
- Run with the command: npm start
    
    NOTE: CTRL + C to Stop