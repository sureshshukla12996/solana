# Solana DexScreener Bot 🚀

A Node.js bot that monitors DexScreener for newly launched Solana tokens and automatically sends their contract addresses and details to a Telegram group.

## Features

- 🔍 **Real-time Monitoring**: Continuously monitors DexScreener for new Solana token launches
- 📱 **Telegram Notifications**: Sends formatted alerts with token details to your Telegram group
- 🚫 **Duplicate Prevention**: Tracks sent tokens to avoid duplicate notifications
- 🛡️ **Error Handling**: Robust error handling and retry logic for API failures
- 📊 **Comprehensive Details**: Includes token name, symbol, contract address, liquidity, price, and more
- ⚙️ **Configurable**: Easy configuration via environment variables

## Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- A Telegram bot token
- A Telegram chat/group ID

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sureshshukla12996/solana.git
   cd solana
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your configuration:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_CHAT_ID=your_chat_id_here
   CHECK_INTERVAL=60
   ```

## Getting Telegram Credentials

### Getting Your Bot Token

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` command
3. Follow the prompts to create your bot:
   - Choose a name for your bot (e.g., "Solana Token Monitor")
   - Choose a username (must end with 'bot', e.g., "solana_token_monitor_bot")
4. BotFather will give you a token that looks like: `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`
5. Copy this token and add it to your `.env` file as `TELEGRAM_BOT_TOKEN`

### Getting Your Chat ID

**Option 1: Using a Web Browser**

1. Add your bot to your group/channel
2. Send a message in the group (any message)
3. Open this URL in your browser (replace `<YOUR_BOT_TOKEN>` with your actual token):
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
4. Look for `"chat":{"id":` in the JSON response
5. The number after `"id":` is your chat ID (e.g., `-1001234567890` for groups)
6. Add this to your `.env` file as `TELEGRAM_CHAT_ID`

**Option 2: Using IDBot**

1. Add [@myidbot](https://t.me/myidbot) to your group
2. Send `/getgroupid` in the group
3. The bot will reply with your group's chat ID
4. Remove @myidbot from the group (optional)

## Usage

### Build the Project

```bash
npm run build
```

### Start the Bot

**Production mode:**
```bash
npm start
```

**Development mode (with ts-node):**
```bash
npm run dev
```

### What to Expect

Once started, the bot will:
1. Connect to Telegram and verify credentials
2. Load previously sent tokens (if any)
3. Check DexScreener every 60 seconds (or your configured interval)
4. Send formatted messages to your Telegram group when new tokens are detected

**Example notification:**
```
🚀 New Solana Token Detected!

Token: Example Token (EXT)
Contract: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU

Chain: Solana
DEX: Raydium
Price: $0.00001234
Liquidity: $12.5K
FDV: $1.2M
Created: Tue, 04 Feb 2025 10:30:00 GMT

🔗 Links:
📊 DexScreener
🔍 Solscan
```

## Configuration Options

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token from BotFather | - | Yes |
| `TELEGRAM_CHAT_ID` | Target chat/group ID for notifications | - | Yes |
| `CHECK_INTERVAL` | How often to check for new tokens (seconds) | 60 | No |

## Project Structure

```
solana/
├── src/
│   ├── index.ts                 # Main bot application
│   ├── config.ts                # Configuration loader
│   ├── logger.ts                # Logging utility
│   ├── types.ts                 # TypeScript type definitions
│   ├── dexscreener.service.ts   # DexScreener API integration
│   ├── telegram.service.ts      # Telegram bot integration
│   └── token-tracker.ts         # Duplicate prevention system
├── .env.example                 # Example environment variables
├── .gitignore                   # Git ignore rules
├── package.json                 # Project dependencies
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

## How It Works

1. **Monitoring**: The bot polls the DexScreener API every configured interval (default: 60 seconds)
2. **Filtering**: Filters for Solana tokens that were created in the last 5 minutes
3. **Duplicate Check**: Checks if the token has already been sent using the token tracker
4. **Notification**: Formats and sends a rich notification to your Telegram group
5. **Tracking**: Records the token address to prevent duplicate notifications
6. **Persistence**: Saves sent token addresses to `sent-tokens.json` for persistence across restarts

## Error Handling

- **API Failures**: Automatically retries on next interval if API calls fail
- **Telegram Errors**: Logs errors and continues monitoring
- **Rate Limiting**: Adds delays between messages to respect Telegram's rate limits
- **Graceful Shutdown**: Handles SIGINT and SIGTERM signals for clean shutdowns

## Logging

The bot logs all activities to the console with timestamps:
- ℹ️ Info: General operations and status updates
- ⚠️ Warnings: Non-critical issues
- ❌ Errors: Failed operations with details

## Troubleshooting

### "TELEGRAM_BOT_TOKEN environment variable is required"
- Make sure you've created a `.env` file with your bot token
- Verify the token is correctly copied from BotFather

### "Failed to connect to Telegram"
- Check that your bot token is valid
- Ensure your bot is not blocked
- Verify network connectivity

### "No new tokens found"
- This is normal if there are no recent token launches
- The bot checks every configured interval
- DexScreener API may have rate limits

### Bot sends messages but not to my group
- Verify your chat ID is correct (should be negative for groups)
- Ensure the bot is added to the group as a member
- Check that the bot has permission to send messages in the group

## Development

### Watch Mode

For development with automatic recompilation:
```bash
npm run watch
```

### Adding New Features

The codebase is modular and easy to extend:
- **DexScreener Service**: Modify `dexscreener.service.ts` to change data fetching
- **Telegram Service**: Update `telegram.service.ts` to customize message formatting
- **Token Tracker**: Extend `token-tracker.ts` for advanced tracking logic

## Security

- Never commit your `.env` file to version control
- Keep your bot token private
- Regularly rotate your bot token if compromised
- Use environment variables for all sensitive configuration

## Performance

- **Memory Usage**: The bot tracks sent tokens in memory and persists to disk
- **API Limits**: Respects DexScreener and Telegram API rate limits
- **Scalability**: Can handle hundreds of new tokens per day

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this bot for your own projects!

## Disclaimer

This bot is for informational purposes only. Always do your own research (DYOR) before investing in any cryptocurrency. The developers are not responsible for any financial losses.

## Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the logs for error messages
3. Open an issue on GitHub with detailed information

---

**Made with ❤️ for the Solana community**