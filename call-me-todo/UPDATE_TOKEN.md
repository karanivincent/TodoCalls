# Update WhatsApp Access Token

The WhatsApp access token needs to be updated in Vercel.

## Latest Working Token
The token that worked when Meta sent you the test message:
```
EAAR8RsVwkA0BPeCQadV0ZATK3plTWG5ftt3gjB0fZAQgFUn0exbZAZCvUQUbyuh8ZCVXlbNqyMdoZBH1p2HZCpHenbvThPYYQUKAqU6u09uhQGyZBp0wvp9XE5MJbxZAtiqs6Xjz19lkfMwLMefbWpJzf6H6fZC3OfmWxSAexhbBcatQVOndh2ztOSZAAVMzD0LhZCHFFLCBXzFjtu9AfsXwIE0ZBY5D9ZBSYNRnbZBO74tsZApWnQ7JLgoZD
```

## Update in Vercel:
1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Find `WHATSAPP_ACCESS_TOKEN`
3. Update with the token above
4. Save and redeploy

## Or via CLI:
```bash
vercel env rm WHATSAPP_ACCESS_TOKEN production
vercel env add WHATSAPP_ACCESS_TOKEN production
# Paste the token when prompted
vercel --prod --force
```